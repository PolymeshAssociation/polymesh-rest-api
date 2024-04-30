import { Injectable } from '@nestjs/common';
import {
  Account,
  AccountBalance,
  ExtrinsicData,
  Identity,
  MultiSig,
  MultiSigDetails,
  Permissions,
  ResultSet,
} from '@polymeshassociation/polymesh-sdk/types';

import { ModifyPermissionsDto } from '~/accounts/dto/modify-permissions.dto';
import { RevokePermissionsDto } from '~/accounts/dto/revoke-permissions.dto';
import { TransactionHistoryFiltersDto } from '~/accounts/dto/transaction-history-filters.dto';
import { TransferPolyxDto } from '~/accounts/dto/transfer-polyx.dto';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { extractTxOptions, ServiceReturn } from '~/common/utils';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { TransactionsService } from '~/transactions/transactions.service';
import { handleSdkError } from '~/transactions/transactions.util';

export type AccountDetails = {
  identity: Identity | null;
  multiSigDetails: MultiSigDetails | null;
};

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
    return await polymeshApi.accountManagement.getAccount({ address }).catch(error => {
      throw handleSdkError(error);
    });
  }

  public async getIdentity(address: string): Promise<Identity | null> {
    const account = await this.findOne(address);
    return account.getIdentity();
  }

  public async getAccountBalance(account: string): Promise<AccountBalance> {
    const {
      polymeshService: { polymeshApi },
    } = this;
    return polymeshApi.accountManagement.getAccountBalance({ account });
  }

  public async transferPolyx(params: TransferPolyxDto): ServiceReturn<void> {
    const { options, args } = extractTxOptions(params);
    const { polymeshService, transactionsService } = this;

    const { transferPolyx } = polymeshService.polymeshApi.network;
    return transactionsService.submit(transferPolyx, args, options);
  }

  public async getTransactionHistory(
    address: string,
    filters: TransactionHistoryFiltersDto
  ): Promise<ResultSet<ExtrinsicData>> {
    const account = await this.findOne(address);

    return account.getTransactionHistory(filters);
  }

  public async getPermissions(address: string): Promise<Permissions> {
    const account = await this.findOne(address);
    return await account.getPermissions().catch(error => {
      throw handleSdkError(error);
    });
  }

  public async freezeSecondaryAccounts(
    transactionBaseDto: TransactionBaseDto
  ): ServiceReturn<void> {
    const { options } = extractTxOptions(transactionBaseDto);
    const { freezeSecondaryAccounts } = this.polymeshService.polymeshApi.accountManagement;

    return this.transactionsService.submit(freezeSecondaryAccounts, undefined, options);
  }

  public async unfreezeSecondaryAccounts(
    transactionBaseDto: TransactionBaseDto
  ): ServiceReturn<void> {
    const { options } = extractTxOptions(transactionBaseDto);
    const { unfreezeSecondaryAccounts } = this.polymeshService.polymeshApi.accountManagement;

    return this.transactionsService.submit(unfreezeSecondaryAccounts, undefined, options);
  }

  public async revokePermissions(params: RevokePermissionsDto): ServiceReturn<void> {
    const { options, args } = extractTxOptions(params);

    const { revokePermissions } = this.polymeshService.polymeshApi.accountManagement;

    return this.transactionsService.submit(revokePermissions, args, options);
  }

  public async modifyPermissions(params: ModifyPermissionsDto): ServiceReturn<void> {
    const { options, args } = extractTxOptions(params);

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
      options
    );
  }

  private async getMultiSigDetails(multiSig: MultiSig | null): Promise<MultiSigDetails | null> {
    if (!multiSig) {
      return null;
    }

    return await multiSig.details();
  }

  public async getDetails(address: string): Promise<AccountDetails> {
    const account = await this.findOne(address);

    const [identity, multiSig] = await Promise.all([account.getIdentity(), account.getMultiSig()]);

    const multiSigDetails = await this.getMultiSigDetails(multiSig);

    return {
      identity,
      multiSigDetails,
    };
  }
}
