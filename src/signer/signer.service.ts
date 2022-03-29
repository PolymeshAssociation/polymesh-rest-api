import { Injectable, NotFoundException } from '@nestjs/common';
import { HashicorpVaultSigningManager } from '@polymathnetwork/hashicorp-vault-signing-manager';
import { LocalSigningManager } from '@polymathnetwork/local-signing-manager';

import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { PolymeshService } from '~/polymesh/polymesh.service';

@Injectable()
export abstract class SignerService {
  public abstract getAddressByHandle(handle: string): Promise<string>;

  public abstract initialize(accounts?: Record<string, string>): Promise<void>;

  protected throwNoSigner(handle: string): never {
    throw new NotFoundException(`There is no signer associated to "${handle}"`);
  }
}

export class LocalSigner extends SignerService {
  private addressBook: Record<string, string> = {};

  constructor(
    private readonly signingManager: LocalSigningManager,
    private readonly polymeshService: PolymeshService,
    private readonly logger: PolymeshLogger
  ) {
    super();
    this.logger.setContext(SignerService.name);
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
    const manager = this.signingManager;
    await this.polymeshService.polymeshApi.setSigningManager(manager);
    Object.entries(accounts).forEach(([handle, mnemonic]) => {
      const address = manager.addAccount({ mnemonic });
      this.setAddressByHandle(handle, address);
      this.logKey(handle, address);
    });
  }

  private logKey(handle: string, address: string): void {
    this.logger.log(`Key "${handle}" with address "${address}" was loaded`);
  }
}

export class VaultSigner extends SignerService {
  constructor(
    private readonly signingManager: HashicorpVaultSigningManager,
    private readonly polymeshService: PolymeshService,
    private readonly logger: PolymeshLogger
  ) {
    super();
    this.logger.setContext(VaultSigner.name);
  }

  public initialize(): Promise<void> {
    this.polymeshService.polymeshApi.setSigningManager(this.signingManager);
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
