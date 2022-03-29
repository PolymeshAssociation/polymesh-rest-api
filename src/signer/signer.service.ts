import { Injectable, NotFoundException } from '@nestjs/common';
import { HashicorpVaultSigningManager } from '@polymathnetwork/hashicorp-vault-signing-manager';
import { LocalSigningManager } from '@polymathnetwork/local-signing-manager';
import { SigningManager } from '@polymathnetwork/signing-manager-types';

import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { PolymeshService } from '~/polymesh/polymesh.service';

@Injectable()
export class SignerService {
  private addressBook: Record<string, string> = {};
  constructor(
    public readonly signingManager: SigningManager,
    private readonly polymeshService: PolymeshService,
    private readonly logger: PolymeshLogger
  ) {
    this.logger.setContext(SignerService.name);
  }

  public async getAddressByHandle(handle: string): Promise<string> {
    let address: string;
    if (this.signingManager instanceof LocalSigningManager) {
      address = this.addressBook[handle];
    } else {
      address = await this.checkVaultKeys(handle);
    }

    if (!address) {
      throw new NotFoundException(`There is no signer associated to "${handle}"`);
    }

    return address;
  }

  public setAddressByHandle(handle: string, address: string): void {
    this.addressBook[handle] = address;
  }

  public async loadAccounts(accounts: Record<string, string> = {}): Promise<void> {
    const manager = this.signingManager;
    await this.polymeshService.polymeshApi.setSigningManager(manager);
    if (manager instanceof LocalSigningManager) {
      Object.entries(accounts).forEach(([handle, mnemonic]) => {
        const address = manager.addAccount({ mnemonic });
        this.setAddressByHandle(handle, address);
        this.logKey(handle, address);
      });
    } else if (manager instanceof HashicorpVaultSigningManager) {
      // logs available keys on startup for developer convenience
      const keys = await manager.getVaultKeys();
      keys.forEach(({ name, version, address }) => {
        const keyName = `${name}-${version}`;
        this.logKey(keyName, address);
      });
    }
  }

  /**
   * @hidden
   *
   * If the signing manager is a Vault signer, this method will check if they key is present as it may have been added after initialization
   */
  private async checkVaultKeys(handle: string): Promise<string> {
    if (this.signingManager instanceof HashicorpVaultSigningManager) {
      const keys = await this.signingManager.getVaultKeys();
      const key = keys.find(({ name, version }) => `${name}-${version}` === handle);
      if (key) {
        this.logKey(handle, key.address);
        return key.address;
      }
    }
    return '';
  }

  private logKey(handle: string, address: string): void {
    this.logger.log(`Key "${handle}" with address "${address}" was loaded`);
  }
}
