import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ErrorCode,
  Identity,
  isPolymeshError,
  SecurityToken,
} from '@polymathnetwork/polymesh-sdk/types';

import { QueueResult } from '~/common/types';
import { processQueue } from '~/common/utils/utils';
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
      return await polymeshApi.getIdentity({ did });
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
   * Method to get trusting tokens for a specific did
   */
  public async findTrustingTokens(did: string): Promise<SecurityToken[]> {
    const identity = await this.findOne(did);
    return identity.getTrustingTokens();
  }

  public async addSecondaryKey(
    addSecondaryKeyParamsDto: AddSecondaryKeyParamsDto
  ): Promise<QueueResult<void>> {
    const { signer, expiry, permissions, secondaryKey } = addSecondaryKeyParamsDto;
    const identity = await this.findOne(signer);
    const address = this.relayerAccountsService.findAddressByDid(signer);
    const params = {
      targetAccount: secondaryKey,
      permissions: permissions?.toPermissionsLike(),
      expiry,
    };
    return processQueue(identity.inviteAccount, params, { signer: address });
  }
}
