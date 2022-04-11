import { Injectable } from '@nestjs/common';
import {
  Account,
  AccountBalance,
  ExtrinsicData,
  ResultSet,
} from '@polymathnetwork/polymesh-sdk/types';

import { TransactionHistoryFiltersDto } from '~/accounts/dto/transaction-history-filters.dto';
import { TransferPolyxDto } from '~/accounts/dto/transfer-polyx.dto';
import { processQueue, QueueResult } from '~/common/utils';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { SigningService } from '~/signing/signing.service';

@Injectable()
export class AccountsService {
  constructor(
    private readonly polymeshService: PolymeshService,
    private readonly signingService: SigningService
  ) {}

  public async findOne(address: string): Promise<Account> {
    const {
      polymeshService: { polymeshApi },
    } = this;
    return polymeshApi.accountManagement.getAccount({ address });
  }

  public async getAccountBalance(account: string): Promise<AccountBalance> {
    const {
      polymeshService: { polymeshApi },
    } = this;
    return polymeshApi.accountManagement.getAccountBalance({ account });
  }

  public async transferPolyx(params: TransferPolyxDto): Promise<QueueResult<void>> {
    const { signer, ...rest } = params;
    const { signingService, polymeshService } = this;

    const address = await signingService.getAddressByHandle(signer);

    const { transferPolyx } = polymeshService.polymeshApi.network;

    return processQueue(transferPolyx, rest, { signingAccount: address });
  }

  public async getTransactionHistory(
    address: string,
    filters: TransactionHistoryFiltersDto
  ): Promise<ResultSet<ExtrinsicData>> {
    const account = await this.findOne(address);

    const { field, order, ...rest } = filters;

    let orderBy;
    if (field && order) {
      orderBy = { field, order };
    }

    return await account.getTransactionHistory({ ...rest, ...orderBy });
  }
}
