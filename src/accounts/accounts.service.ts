import { BadRequestException, Injectable } from '@nestjs/common';
import {
  Account,
  AccountBalance,
  ErrorCode,
  ExtrinsicData,
  ResultSet,
} from '@polymathnetwork/polymesh-sdk/types';
import { isPolymeshError } from '@polymathnetwork/polymesh-sdk/utils';

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
    try {
      return await polymeshApi.accountManagement.getAccount({ address });
    } catch (err: unknown) {
      if (isPolymeshError(err)) {
        const { code, message } = err;
        if (
          code === ErrorCode.ValidationError &&
          message.startsWith('The supplied address is not a valid')
        ) {
          throw new BadRequestException(`The address "${address}" is not a valid SS58 address`);
        }
        if (
          code === ErrorCode.ValidationError &&
          message.startsWith('The supplied address is not encoded')
        ) {
          throw new BadRequestException(
            `The address "${address}" is not encoded with the chain's SS58 format "${polymeshApi.network
              .getSs58Format()
              .toString()}"`
          );
        }
      }

      throw err;
    }
  }

  public async getAccountBalance(account: string): Promise<AccountBalance> {
    const {
      polymeshService: { polymeshApi },
    } = this;
    return await polymeshApi.accountManagement.getAccountBalance({ account });
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
