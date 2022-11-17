import { Injectable, NotFoundException } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  Account,
  AuthorizationRequest,
  AuthorizationType,
  ErrorCode,
  Identity,
  ResultSet,
} from '@polymeshassociation/polymesh-sdk/types';
import { isPolymeshError } from '@polymeshassociation/polymesh-sdk/utils';

import { AccountsService } from '~/accounts/accounts.service';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { ServiceReturn } from '~/common/utils';
import { IdentitiesService } from '~/identities/identities.service';
import { TransactionsService } from '~/transactions/transactions.service';

@Injectable()
export class AuthorizationsService {
  constructor(
    private readonly identitiesService: IdentitiesService,
    private readonly accountsService: AccountsService,
    private readonly transactionsService: TransactionsService
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

  public async findOne(
    signatory: Identity | Account,
    id: BigNumber
  ): Promise<AuthorizationRequest> {
    try {
      return await signatory.authorizations.getOne({ id });
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

  public async findOneByDid(did: string, id: BigNumber): Promise<AuthorizationRequest> {
    const identity = await this.identitiesService.findOne(did);

    return this.findOne(identity, id);
  }

  public async getAuthRequest(address: string, id: BigNumber): Promise<AuthorizationRequest> {
    const account = await this.accountsService.findOne(address);

    const identity = await account.getIdentity();

    let authRequest: AuthorizationRequest | undefined;
    if (identity) {
      authRequest = await this.findOne(identity, id).catch(error => {
        if (error instanceof NotFoundException) {
          return undefined;
        } else {
          throw error;
        }
      });
    }

    if (!authRequest) {
      authRequest = await this.findOne(account, id);
    }

    return authRequest;
  }

  public async accept(id: BigNumber, transactionBaseDto: TransactionBaseDto): ServiceReturn<void> {
    const { signer } = transactionBaseDto;
    const address = await this.transactionsService.getSigningAccount(signer);

    const { accept } = await this.getAuthRequest(address, id);

    return this.transactionsService.submit(accept, {}, transactionBaseDto);
  }

  public async remove(id: BigNumber, transactionBaseDto: TransactionBaseDto): ServiceReturn<void> {
    const { signer } = transactionBaseDto;
    const address = await this.transactionsService.getSigningAccount(signer);

    const { remove } = await this.getAuthRequest(address, id);

    return this.transactionsService.submit(remove, {}, transactionBaseDto);
  }
}
