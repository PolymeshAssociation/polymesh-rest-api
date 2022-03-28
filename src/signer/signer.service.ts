import { Injectable, NotFoundException } from '@nestjs/common';
import { SigningManager } from '@polymathnetwork/signing-manager-types';

import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { isLocalSigningManager, isVaultSigningManager } from '~/signer/util';

@Injectable()
export class SignerService {
  private addressBook: Record<string, string> = {};
  constructor(
    public readonly signerManager: SigningManager,
    private readonly polymeshService: PolymeshService,
    private readonly logger: PolymeshLogger
  ) {
    this.logger.setContext(SignerService.name);
  }

  public getAddressByHandle(handle: string): string {
    const address = this.addressBook[handle];
    if (!address) {
      throw new NotFoundException(`There is no signer associated to "${handle}"`);
    }
    return address;
  }

  public setAddressByHandle(handle: string, address: string): void {
    this.addressBook[handle] = address;
    this.logger.log(`Key "${handle}" with address "${address}" was loaded`);
  }

  public async loadAccounts(accounts: Record<string, string> = {}): Promise<void> {
    const manager = this.signerManager;
    await this.polymeshService.polymeshApi.setSigningManager(manager);
    if (isLocalSigningManager(manager)) {
      Object.entries(accounts).forEach(([handle, mnemonic]) => {
        const address = manager.addAccount({ mnemonic });
        this.setAddressByHandle(handle, address);
      });
    } else if (isVaultSigningManager(manager)) {
      const keys = await manager.getVaultKeys();
      keys.forEach(({ name, version, address }) => {
        const keyName = `${name}-${version}`;
        this.setAddressByHandle(keyName, address);
      });
    }
  }
}
