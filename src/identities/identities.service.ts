import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ErrorCode,
  Identity,
  isPolymeshError,
  SecurityToken,
} from '@polymathnetwork/polymesh-sdk/types';

import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { PolymeshService } from '~/polymesh/polymesh.service';

@Injectable()
export class IdentitiesService {
  constructor(
    private readonly polymeshService: PolymeshService,
    private readonly logger: PolymeshLogger
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
}
