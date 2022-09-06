import { Injectable, NotFoundException } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  AuthorizationRequest,
  AuthorizationType,
  ErrorCode,
  ResultSet,
} from '@polymeshassociation/polymesh-sdk/types';
import { isPolymeshError } from '@polymeshassociation/polymesh-sdk/utils';

import { processTransaction, TransactionResult } from '~/common/utils';
import { IdentitiesService } from '~/identities/identities.service';
import { SigningService } from '~/signing/signing.service';

@Injectable()
export class AuthorizationsService {
  constructor(
    private readonly identitiesService: IdentitiesService,
    private readonly signingService: SigningService
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

  public async findIssuedByDid(did: string): Promise<ResultSet<AuthorizationRequest>> {
    const identity = await this.identitiesService.findOne(did);

    return identity.authorizations.getSent();
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

  public async accept(id: BigNumber, signer: string): Promise<TransactionResult<void>> {
    const { accept } = await this.findOne(signer, id);

    const address = await this.signingService.getAddressByHandle(signer);
    // TODO: find a way of making processQueue type safe for NoArgsProcedureMethods
    return processTransaction(accept, { signingAccount: address }, {});
  }

  public async remove(id: BigNumber, signer: string): Promise<TransactionResult<void>> {
    const { remove } = await this.findOne(signer, id);

    const address = await this.signingService.getAddressByHandle(signer);
    // TODO: find a way of making processQueue type safe for NoArgsProcedureMethods
    return processTransaction(remove, { signingAccount: address }, {});
  }
}
