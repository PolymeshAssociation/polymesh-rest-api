import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Asset,
  AuthorizationRequest,
  ErrorCode,
  Identity,
} from '@polymathnetwork/polymesh-sdk/types';
import { isPolymeshError } from '@polymathnetwork/polymesh-sdk/utils';

import { QueueResult } from '~/common/types';
import { processQueue } from '~/common/utils';
import { AddSecondaryKeyParamsDto } from '~/identities/dto/add-secondary-key-params.dto';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { RelayerAccountsService } from '~/relayer-accounts/relayer-accounts.service';

@Injectable()
export class IdentitiesService {
  constructor(
    private readonly polymeshService: PolymeshService,
    private readonly logger: PolymeshLogger,
    private readonly relayerAccountsService: RelayerAccountsService
  ) {
    this.logger.setContext(IdentitiesService.name);
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

  public async addSecondaryKey(
    addSecondaryKeyParamsDto: AddSecondaryKeyParamsDto
  ): Promise<QueueResult<AuthorizationRequest>> {
    const { signer, expiry, permissions, secondaryKey } = addSecondaryKeyParamsDto;
    const address = this.relayerAccountsService.findAddressByDid(signer);
    const params = {
      targetAccount: secondaryKey,
      permissions: permissions?.toPermissionsLike(),
      expiry,
    };
    const inviteAccount = this.polymeshService.polymeshApi.accountManagement.inviteAccount;
    return processQueue(inviteAccount, params, { signer: address });
  }
}
