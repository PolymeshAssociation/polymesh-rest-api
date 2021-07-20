import { Injectable } from '@nestjs/common';
import {
  AuthorizationRequest,
  AuthorizationType,
  ResultSet,
} from '@polymathnetwork/polymesh-sdk/types';

import { IdentitiesService } from '~/identities/identities.service';

@Injectable()
export class AuthorizationsService {
  constructor(private readonly identitiesService: IdentitiesService) {}

  public async getPendingByDid(
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

  public async getIssuedByDid(
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
}
