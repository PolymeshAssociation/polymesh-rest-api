import { Injectable } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  Account,
  AuthorizationRequest,
  AuthorizationType,
  Identity,
  ResultSet,
} from '@polymeshassociation/polymesh-sdk/types';

import { AccountsService } from '~/accounts/accounts.service';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { AppNotFoundError } from '~/common/errors';
import { ServiceReturn } from '~/common/utils';
import { IdentitiesService } from '~/identities/identities.service';
import { TransactionsService } from '~/transactions/transactions.service';
import { handleSdkError } from '~/transactions/transactions.util';

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
    return await signatory.authorizations.getOne({ id }).catch(handleSdkError);
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
        if (error instanceof AppNotFoundError) {
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
