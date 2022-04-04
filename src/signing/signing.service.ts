import { Injectable, NotFoundException } from '@nestjs/common';
import { HashicorpVaultSigningManager } from '@polymathnetwork/hashicorp-vault-signing-manager';
import { LocalSigningManager } from '@polymathnetwork/local-signing-manager';
import { SigningManager } from '@polymathnetwork/signing-manager-types';
import _ from 'lodash';

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
    this.logger.setContext(SigningService.name);
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

  public async initialize(accounts: Record<string, string> = {}): Promise<void> {
    await super.initialize();
    _.forEach(accounts, (mnemonic, handle) => {
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

  public async initialize(): Promise<void> {
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
