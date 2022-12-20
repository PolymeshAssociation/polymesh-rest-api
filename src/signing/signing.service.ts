import { Injectable, NotFoundException } from '@nestjs/common';
import { FireblocksSigningManager } from '@polymeshassociation/fireblocks-signing-manager';
import { DerivationPath } from '@polymeshassociation/fireblocks-signing-manager/lib/fireblocks';
import { HashicorpVaultSigningManager } from '@polymeshassociation/hashicorp-vault-signing-manager';
import { LocalSigningManager } from '@polymeshassociation/local-signing-manager';
import { SigningManager } from '@polymeshassociation/signing-manager-types';
import { forEach } from 'lodash';

import { AppValidationError } from '~/common/errors';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { PolymeshService } from '~/polymesh/polymesh.service';

@Injectable()
export abstract class SigningService {
  protected readonly signingManager: SigningManager;
  protected readonly polymeshService: PolymeshService;

  public abstract getAddressByHandle(handle: string): Promise<string>;

  public async initialize(): Promise<void> {
    return this.polymeshService.polymeshApi.setSigningManager(this.signingManager);
  }

  protected throwNoSigner(handle: string): never {
    throw new NotFoundException(`There is no signer associated to "${handle}"`);
  }
}

export class LocalSigningService extends SigningService {
  private addressBook: Record<string, string> = {};

  constructor(
    protected readonly signingManager: LocalSigningManager,
    protected readonly polymeshService: PolymeshService,
    private readonly logger: PolymeshLogger
  ) {
    super();
    this.logger.setContext(LocalSigningService.name);
  }

  public getAddressByHandle(handle: string): Promise<string> {
    const address = this.addressBook[handle];

    if (!address) {
      this.throwNoSigner(handle);
    }

    return Promise.resolve(address);
  }

  public setAddressByHandle(handle: string, address: string): void {
    this.addressBook[handle] = address;
  }

  public override async initialize(accounts: Record<string, string> = {}): Promise<void> {
    await super.initialize();
    forEach(accounts, (mnemonic, handle) => {
      const address = this.signingManager.addAccount({ mnemonic });
      this.setAddressByHandle(handle, address);
      this.logKey(handle, address);
    });
  }

  private logKey(handle: string, address: string): void {
    this.logger.log(`Key "${handle}" with address "${address}" was loaded`);
  }
}

export class VaultSigningService extends SigningService {
  constructor(
    protected readonly signingManager: HashicorpVaultSigningManager,
    protected readonly polymeshService: PolymeshService,
    private readonly logger: PolymeshLogger
  ) {
    super();
    this.logger.setContext(VaultSigningService.name);
  }

  public override async initialize(): Promise<void> {
    await super.initialize();
    return this.logKeys();
  }

  public async getAddressByHandle(handle: string): Promise<string> {
    const keys = await this.signingManager.getVaultKeys();
    const key = keys.find(({ name, version }) => `${name}-${version}` === handle);
    if (key) {
      this.logKey(handle, key.address);
      return key.address;
    } else {
      this.throwNoSigner(handle);
    }
  }

  public async logKeys(): Promise<void> {
    const keys = await this.signingManager.getVaultKeys();
    keys.forEach(({ name, version, address }) => {
      const keyName = `${name}-${version}`;
      this.logKey(keyName, address);
    });
  }

  private logKey(handle: string, address: string): void {
    this.logger.log(`Key "${handle}" with address "${address}" was loaded`);
  }
}

export class FireblocksSigningService extends SigningService {
  constructor(
    protected readonly signingManager: FireblocksSigningManager,
    protected readonly polymeshService: PolymeshService,
    private readonly logger: PolymeshLogger
  ) {
    super();
    this.logger.setContext(FireblocksSigningService.name);
  }

  public async getAddressByHandle(handle: string): Promise<string> {
    const derivePath = this.handleToDerivationPath(handle);

    const key = await this.signingManager.deriveAccount(derivePath);
    return key.address;
  }

  private handleToDerivationPath(handle: string): DerivationPath {
    const sections = handle.split('-').map(Number);

    if (sections.some(isNaN) || sections.length > 3 || handle === '') {
      throw new AppValidationError(
        'Fireblocks `signer` field should be 3 integers formatted like: `x-y-z`'
      );
    }

    /**
     * Mainnet should use `595` as the coinType, otherwise it should be `1` to indicate a test net
     * reference: https://github.com/satoshilabs/slips/blob/2a2f4c79508749f7e679a127d5a56da079b8d2d8/slip-0044.md?plain=1#L32
     */
    const coinType = this.signingManager.ss58Format === 12 ? 595 : 1;

    const [accountId, change, accountIndex] = sections;

    return [44, coinType, accountId, change || 0, accountIndex || 0];
  }
}
