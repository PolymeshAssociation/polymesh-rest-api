import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Asset,
  AuthorizationRequest,
  ErrorCode,
  Identity,
} from '@polymathnetwork/polymesh-sdk/types';
import { isPolymeshError } from '@polymathnetwork/polymesh-sdk/utils';

import { processQueue, QueueResult } from '~/common/utils';
import { AddSecondaryAccountParamsDto } from '~/identities/dto/add-secondary-account-params.dto';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { SigningService } from '~/signing/signing.service';

@Injectable()
export class IdentitiesService {
  constructor(
    private readonly polymeshService: PolymeshService,
    private readonly logger: PolymeshLogger,
    private readonly signingService: SigningService
  ) {
    logger.setContext(IdentitiesService.name);
  }

  /**
   * Method to get identity for a specific did
   */
  public async findOne(did: string): Promise<Identity> {
    const {
      polymeshService: { polymeshApi },
    } = this;
    try {
      return await polymeshApi.identities.getIdentity({ did });
    } catch (err: unknown) {
      if (isPolymeshError(err)) {
        const { code } = err;
        if (code === ErrorCode.DataUnavailable) {
          this.logger.error(`No valid identity found for did "${did}"`);
          throw new NotFoundException(`There is no Identity with DID "${did}"`);
        }
      }
      throw err;
    }
  }

  /**
   * Method to get trusting Assets for a specific did
   */
  public async findTrustingAssets(did: string): Promise<Asset[]> {
    const identity = await this.findOne(did);
    return identity.getTrustingAssets();
  }

  public async addSecondaryAccount(
    addSecondaryAccountParamsDto: AddSecondaryAccountParamsDto
  ): Promise<QueueResult<AuthorizationRequest>> {
    const { signer, expiry, permissions, secondaryAccount } = addSecondaryAccountParamsDto;
    const address = await this.signingService.getAddressByHandle(signer);
    const params = {
      targetAccount: secondaryAccount,
      permissions: permissions?.toPermissionsLike(),
      expiry,
    };
    const inviteAccount = this.polymeshService.polymeshApi.accountManagement.inviteAccount;
    return processQueue(inviteAccount, params, { signingAccount: address });
  }
}
