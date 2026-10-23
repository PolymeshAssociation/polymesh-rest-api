import { LocalSigningManager } from '@polymeshassociation/local-signing-manager';
import { forEach } from 'lodash';

import { AppConflictError, AppNotFoundError, AppValidationError } from '~/common/errors';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { SigningService } from '~/signing/services/signing.service';

export class LocalSigningService extends SigningService {
  private addressBook: Record<string, string> = Object.create(null);

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

  public override getHandleByAddress(address: string): Promise<string> {
    const handle = Object.entries(this.addressBook).find(
      ([, keyAddress]) => keyAddress === address
    )?.[0];

    if (handle) {
      return Promise.resolve(handle);
    }

    return Promise.reject(new AppNotFoundError(address, 'signer'));
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

  public addSigner(handle: string, mnemonic: string): Promise<string> {
    const existingAddress = this.addressBook[handle];
    if (existingAddress) {
      return Promise.reject(new AppConflictError(existingAddress, handle));
    }

    let address: string;
    try {
      address = this.signingManager.addAccount({ mnemonic });
    } catch {
      // the underlying error is deliberately dropped so the mnemonic can never be echoed back or logged
      return Promise.reject(new AppValidationError('the provided mnemonic is not valid'));
    }

    this.setAddressByHandle(handle, address);
    this.logKey(handle, address);

    return Promise.resolve(address);
  }
}
