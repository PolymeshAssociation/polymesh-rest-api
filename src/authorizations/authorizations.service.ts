import { Injectable, NotFoundException } from '@nestjs/common';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import {
  AuthorizationRequest,
  AuthorizationType,
  ErrorCode,
  ResultSet,
} from '@polymathnetwork/polymesh-sdk/types';
import { isPolymeshError } from '@polymathnetwork/polymesh-sdk/utils';

import { IdentitiesService } from '~/identities/identities.service';

@Injectable()
export class AuthorizationsService {
  constructor(private readonly identitiesService: IdentitiesService) {}

  public async findPendingByDid(
    did: string,
    includeExpired?: boolean,
    type?: AuthorizationType
  ): Promise<AuthorizationRequest[]> {
    const identity = await this.identitiesService.findOne(did);

    return identity.authorizations.getReceived({
      includeExpired,
      type,
    });
  }

  public async findIssuedByDid(
    did: string,
    size: number,
    start?: string
  ): Promise<ResultSet<AuthorizationRequest>> {
    const identity = await this.identitiesService.findOne(did);

    return identity.authorizations.getSent({
      size,
      start,
    });
  }

  public async findOne(did: string, id: BigNumber): Promise<AuthorizationRequest> {
    const identity = await this.identitiesService.findOne(did);
    try {
      return identity.authorizations.getOne({ id });
    } catch (err: unknown) {
      if (isPolymeshError(err)) {
        const { code } = err;
        if (code === ErrorCode.DataUnavailable) {
          throw new NotFoundException(
            `There is no pending Authorization with ID "${id.toString()}"`
          );
        }
      }
      throw err;
    }
  }
}
