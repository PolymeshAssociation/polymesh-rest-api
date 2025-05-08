import { Injectable } from '@nestjs/common';
import { TransactionPayload } from '@polymeshassociation/polymesh-sdk/types';
import { SigningManager } from '@polymeshassociation/signing-manager-types';

import { AppInternalError, AppNotFoundError } from '~/common/errors';
import { PolymeshService } from '~/polymesh/polymesh.service';

@Injectable()
export abstract class SigningService {
  protected readonly signingManager: SigningManager;
  protected readonly polymeshService: PolymeshService;

  public abstract getAddressByHandle(handle: string): Promise<string>;

  public isAddress(address: string): boolean {
    return this.polymeshService.polymeshApi.accountManagement.isValidAddress({ address });
  }

  public async signPayload(payload: TransactionPayload['payload']): Promise<string> {
    const { signature } = await this.signingManager.getExternalSigner().signPayload(payload);

    return signature;
  }

  public async initialize(): Promise<void> {
    return this.polymeshService.polymeshApi.setSigningManager(this.signingManager);
  }

  protected throwNoSigner(handle: string): never {
    throw new AppNotFoundError(handle, 'signer');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async addSigner(handle: string, mnemonic: string): Promise<string> {
    throw new AppInternalError('Adding signers is not supported with the configured service');
  }
}
