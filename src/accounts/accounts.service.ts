import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  Account,
  AccountBalance,
  ErrorCode,
  ExtrinsicData,
  Permissions,
  ResultSet,
  SubsidyWithAllowance,
} from '@polymeshassociation/polymesh-sdk/types';
import { isPolymeshError } from '@polymeshassociation/polymesh-sdk/utils';

import { ModifyPermissionsDto } from '~/accounts/dto/modify-permissions.dto';
import { RevokePermissionsDto } from '~/accounts/dto/revoke-permissions.dto';
import { TransactionHistoryFiltersDto } from '~/accounts/dto/transaction-history-filters.dto';
import { TransferPolyxDto } from '~/accounts/dto/transfer-polyx.dto';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { ServiceReturn } from '~/common/utils';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { TransactionsService } from '~/transactions/transactions.service';

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
      return polymeshApi.accountManagement.getAccount({ address });
    } catch (err: unknown) {
      if (isPolymeshError(err)) {
        const { code } = err;
        if (code === ErrorCode.ValidationError) {
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
    return polymeshApi.accountManagement.getAccountBalance({ account });
  }

  public async transferPolyx(params: TransferPolyxDto): ServiceReturn<void> {
    const { signer, webhookUrl, dryRun, ...rest } = params;
    const { polymeshService, transactionsService } = this;

    const { transferPolyx } = polymeshService.polymeshApi.network;
    return transactionsService.submit(transferPolyx, rest, { signer, webhookUrl, dryRun });
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
      if (isPolymeshError(err)) {
        const { code } = err;
        if (code === ErrorCode.DataUnavailable) {
          throw new NotFoundException(`There is no Identity associated with Account "${address}"`);
        }
      }
      throw err;
    }
  }

  public async getSubsidy(address: string): Promise<SubsidyWithAllowance | null> {
    const account = await this.findOne(address);
    return account.getSubsidy();
  }

  public async freezeSecondaryAccounts(
    transactionBaseDto: TransactionBaseDto
  ): ServiceReturn<void> {
    const { freezeSecondaryAccounts } = this.polymeshService.polymeshApi.accountManagement;

    return this.transactionsService.submit(freezeSecondaryAccounts, undefined, transactionBaseDto);
  }

  public async unfreezeSecondaryAccounts(opts: TransactionBaseDto): ServiceReturn<void> {
    const { signer, webhookUrl, dryRun } = opts;
    const { unfreezeSecondaryAccounts } = this.polymeshService.polymeshApi.accountManagement;

    return this.transactionsService.submit(unfreezeSecondaryAccounts, undefined, {
      signer,
      webhookUrl,
      dryRun,
    });
  }

  public async revokePermissions(params: RevokePermissionsDto): ServiceReturn<void> {
    const { signer, webhookUrl, dryRun, secondaryAccounts } = params;

    const { revokePermissions } = this.polymeshService.polymeshApi.accountManagement;

    return this.transactionsService.submit(
      revokePermissions,
      {
        secondaryAccounts,
      },
      { signer, webhookUrl, dryRun }
    );
  }

  public async modifyPermissions(params: ModifyPermissionsDto): ServiceReturn<void> {
    const { signer, webhookUrl, dryRun, secondaryAccounts } = params;

    const { modifyPermissions } = this.polymeshService.polymeshApi.accountManagement;

    return this.transactionsService.submit(
      modifyPermissions,
      {
        secondaryAccounts: secondaryAccounts.map(({ secondaryAccount: account, permissions }) => ({
          account,
          permissions: permissions.toPermissionsLike(),
        })),
      },
      { signer, webhookUrl, dryRun }
    );
  }
}
