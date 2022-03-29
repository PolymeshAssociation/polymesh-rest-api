import { Injectable, NotFoundException } from '@nestjs/common';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import {
  AuthorizationRequest,
  AuthorizationType,
  ErrorCode,
  ResultSet,
} from '@polymathnetwork/polymesh-sdk/types';
import { isPolymeshError } from '@polymathnetwork/polymesh-sdk/utils';

import { processQueue, QueueResult } from '~/common/utils';
import { IdentitiesService } from '~/identities/identities.service';
import { RelayerAccountsService } from '~/relayer-accounts/relayer-accounts.service';

@Injectable()
export class AuthorizationsService {
  constructor(
    private readonly identitiesService: IdentitiesService,
    private readonly relayerAccountsService: RelayerAccountsService
  ) {}

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
    size: BigNumber,
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
      return await identity.authorizations.getOne({ id });
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

  public async accept(id: BigNumber, signer: string): Promise<QueueResult<void>> {
    const { accept } = await this.findOne(signer, id);

    const address = this.relayerAccountsService.findAddressByDid(signer);
    // TODO: find a way of making processQueue type safe for NoArgsProcedureMethods
    return processQueue(accept, { signer: address }, {});
  }

  public async reject(id: BigNumber, signer: string): Promise<QueueResult<void>> {
    const { remove } = await this.findOne(signer, id);

    const address = this.relayerAccountsService.findAddressByDid(signer);
    // TODO: find a way of making processQueue type safe for NoArgsProcedureMethods
    return processQueue(remove, { signer: address }, {});
  }
}
