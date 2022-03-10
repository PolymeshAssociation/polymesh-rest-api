import { Injectable, NotFoundException } from '@nestjs/common';
import { LocalSigningManager } from '@polymathnetwork/local-signing-manager';
import { SigningManager } from '@polymathnetwork/signing-manager-types';

import { PolymeshService } from '~/polymesh/polymesh.service';

@Injectable()
export class SignerService {
  private addressBook: Record<string, string> = {}; // This may need to be its own service to support authorization logic
  constructor(
    public readonly signerManager: SigningManager,
    private polymeshService: PolymeshService
  ) {}

  public findAddressBySigner(signer: string): string {
    // we could perform an auth check here to confirm the bearer token
    const address = this.addressBook[signer];
    if (!address) {
      throw new NotFoundException(`There is no signer associated to "${signer}"`);
    }
    return address;
  }

  public async loadAccounts(accounts: Record<string, string>): Promise<void> {
    await this.polymeshService.polymeshApi.setSigningManager(this.signerManager);
    const manager = this.signerManager;
    if (isLocalSigningManager(manager)) {
      Object.entries(accounts).forEach(([handle, mnemonic]) => {
        const address = manager.addAccount({ mnemonic });
        this.addressBook[handle] = address;
      });
    }
  }
}

function isLocalSigningManager(manager: SigningManager): manager is LocalSigningManager {
  return manager instanceof LocalSigningManager;
}
