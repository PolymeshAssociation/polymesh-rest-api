import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfidentialAccount, Identity } from '@polymeshassociation/polymesh-sdk/types';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { ServiceReturn } from '~/common/utils';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { TransactionsService } from '~/transactions/transactions.service';
import { handleSdkError } from '~/transactions/transactions.util';

@Injectable()
export class ConfidentialAccountsService {
  constructor(
    private readonly polymeshService: PolymeshService,
    private readonly transactionsService: TransactionsService
  ) {}

  public async findOne(publicKey: string): Promise<ConfidentialAccount> {
    return await this.polymeshService.polymeshApi.confidentialAccounts
      .getConfidentialAccount({ publicKey })
      .catch(error => {
        throw handleSdkError(error);
      });
  }

  public async fetchOwner(publicKey: string): Promise<Identity> {
    const account = await this.findOne(publicKey);

    const identity = await account.getIdentity();

    if (!identity) {
      throw new NotFoundException('No owner found');
    }

    return identity;
  }

  public async mapConfidentialAccount(
    publicKey: string,
    base: TransactionBaseDto
  ): ServiceReturn<ConfidentialAccount> {
    const createConfidentialAccount =
      this.polymeshService.polymeshApi.confidentialAccounts.createConfidentialAccount;

    return this.transactionsService.submit(createConfidentialAccount, { publicKey }, base);
  }
}
