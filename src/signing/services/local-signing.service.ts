import { LocalSigningManager } from '@polymeshassociation/local-signing-manager';
import { forEach } from 'lodash';

import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { SigningService } from '~/signing/services/signing.service';

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
