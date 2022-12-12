import { Injectable } from '@nestjs/common';
import {
  Account,
  AccountBalance,
  ExtrinsicData,
  Permissions,
  ResultSet,
} from '@polymeshassociation/polymesh-sdk/types';

import { ModifyPermissionsDto } from '~/accounts/dto/modify-permissions.dto';
import { RevokePermissionsDto } from '~/accounts/dto/revoke-permissions.dto';
import { TransactionHistoryFiltersDto } from '~/accounts/dto/transaction-history-filters.dto';
import { TransferPolyxDto } from '~/accounts/dto/transfer-polyx.dto';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { extractTxBase, ServiceReturn } from '~/common/utils';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { TransactionsService } from '~/transactions/transactions.service';
import { handleSdkError } from '~/transactions/transactions.util';

@Injectable()
export class AccountsService {
  constructor(
    private readonly polymeshService: PolymeshService,
    private readonly transactionsService: TransactionsService
  ) {}

  public async findOne(address: string): Promise<Account> {
    const {
      polymeshService: { polymeshApi },
    } = this;
    try {
      return await polymeshApi.accountManagement.getAccount({ address });
    } catch (err) {
      handleSdkError(err);
    }
  }

  public async getAccountBalance(account: string): Promise<AccountBalance> {
    const {
      polymeshService: { polymeshApi },
    } = this;
    return polymeshApi.accountManagement.getAccountBalance({ account });
  }

  public async transferPolyx(params: TransferPolyxDto): ServiceReturn<void> {
    const { base, args } = extractTxBase(params);
    const { polymeshService, transactionsService } = this;

    const { transferPolyx } = polymeshService.polymeshApi.network;
    return transactionsService.submit(transferPolyx, args, base);
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

    return account.getTransactionHistory({ ...rest, ...orderBy });
  }

  public async getPermissions(address: string): Promise<Permissions> {
    const account = await this.findOne(address);
    try {
      return await account.getPermissions();
    } catch (err) {
      handleSdkError(err);
    }
  }

  public async freezeSecondaryAccounts(
    transactionBaseDto: TransactionBaseDto
  ): ServiceReturn<void> {
    const { freezeSecondaryAccounts } = this.polymeshService.polymeshApi.accountManagement;

    return this.transactionsService.submit(freezeSecondaryAccounts, undefined, transactionBaseDto);
  }

  public async unfreezeSecondaryAccounts(opts: TransactionBaseDto): ServiceReturn<void> {
    const { unfreezeSecondaryAccounts } = this.polymeshService.polymeshApi.accountManagement;

    return this.transactionsService.submit(unfreezeSecondaryAccounts, undefined, opts);
  }

  public async revokePermissions(params: RevokePermissionsDto): ServiceReturn<void> {
    const { base, args } = extractTxBase(params);

    const { revokePermissions } = this.polymeshService.polymeshApi.accountManagement;

    return this.transactionsService.submit(revokePermissions, args, base);
  }

  public async modifyPermissions(params: ModifyPermissionsDto): ServiceReturn<void> {
    const { base, args } = extractTxBase(params);

    const { modifyPermissions } = this.polymeshService.polymeshApi.accountManagement;

    return this.transactionsService.submit(
      modifyPermissions,
      {
        secondaryAccounts: args.secondaryAccounts.map(
          ({ secondaryAccount: account, permissions }) => ({
            account,
            permissions: permissions.toPermissionsLike(),
          })
        ),
      },
      base
    );
  }
}
