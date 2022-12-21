import { Injectable, NotFoundException } from '@nestjs/common';
import { SigningManager } from '@polymeshassociation/signing-manager-types';

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
