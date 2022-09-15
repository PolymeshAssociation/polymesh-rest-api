import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';

import { AccountsService } from '~/accounts/accounts.service';
import { createPermissionsModel } from '~/accounts/accounts.util';
import { AccountParamsDto } from '~/accounts/dto/account-params.dto';
import { TransactionHistoryFiltersDto } from '~/accounts/dto/transaction-history-filters.dto';
import { TransferPolyxDto } from '~/accounts/dto/transfer-polyx.dto';
import { PermissionsModel } from '~/accounts/models/permissions.model';
import { BalanceModel } from '~/assets/models/balance.model';
import { ApiArrayResponse, ApiCreatedOrSubscriptionResponse } from '~/common/decorators/swagger';
import { ExtrinsicModel } from '~/common/models/extrinsic.model';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { ApiTransactionResponse, handlePayload } from '~/common/utils';

@ApiTags('accounts')
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @ApiOperation({
    summary: 'Get POLYX balance of an Account',
    description: 'This endpoint provides the free, locked and total POLYX balance of an Account',
  })
  @ApiParam({
    name: 'account',
    description: 'The Account address whose balance is to be fetched',
    type: 'string',
    example: '5GwwYnwCYcJ1Rkop35y7SDHAzbxrCkNUDD4YuCUJRPPXbvyV',
  })
  @ApiOkResponse({
    description: 'Free, locked and total POLYX balance of the Account',
    type: BalanceModel,
  })
  @Get(':account/balance')
  async getAccountBalance(@Param() { account }: AccountParamsDto): Promise<BalanceModel> {
    const accountBalance = await this.accountsService.getAccountBalance(account);
    return new BalanceModel(accountBalance);
  }

  @ApiOperation({
    summary: 'Transfer an amount of POLYX to an account',
    description: 'This endpoint transfers an amount of POLYX to a specified Account',
  })
  @ApiCreatedOrSubscriptionResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @ApiUnprocessableEntityResponse({
    description:
      '<ul>' +
      "<li>The destination Account doesn't have an associated Identity</li>" +
      '<li>The receiver Identity has an invalid CDD claim</li>' +
      '<li>Insufficient free balance</li>' +
      '</ul>',
  })
  @Post('transfer')
  async transferPolyx(@Body() params: TransferPolyxDto): Promise<ApiTransactionResponse> {
    const result = await this.accountsService.transferPolyx(params);
    return handlePayload(result);
  }

  @ApiOperation({
    summary: 'Get transaction history of an Account',
    description:
      'This endpoint provides a list of transactions signed by the given Account. This requires Polymesh GraphQL Middleware Service',
  })
  @ApiParam({
    name: 'account',
    description: 'The Account address whose transaction history is to be fetched',
    type: 'string',
    example: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
  })
  @ApiArrayResponse(ExtrinsicModel, {
    description: 'List of transactions signed by the given Account',
    paginated: true,
  })
  @Get(':account/transactions')
  async getTransactionHistory(
    @Param() { account }: AccountParamsDto,
    @Query() filters: TransactionHistoryFiltersDto
  ): Promise<PaginatedResultsModel<ExtrinsicModel>> {
    const { data, count, next } = await this.accountsService.getTransactionHistory(
      account,
      filters
    );
    return new PaginatedResultsModel({
      results: data.map(extrinsic => new ExtrinsicModel(extrinsic)),
      total: count,
      next,
    });
  }

  @ApiOperation({
    summary: 'Get Account Permissions',
    description:
      'The endpoint retrieves the Permissions an Account has as a Permissioned Account for its corresponding Identity',
  })
  @ApiParam({
    name: 'account',
    description: 'The Account address whose Permissions are to be fetched',
    type: 'string',
    example: '5GwwYnwCYcJ1Rkop35y7SDHAzbxrCkNUDD4YuCUJRPPXbvyV',
  })
  @ApiOkResponse({
    description: 'Permissions of the Account',
    type: PermissionsModel,
  })
  @ApiNotFoundResponse({
    description: 'Account is not associated with any Identity',
  })
  @Get(':account/permissions')
  async getPermissions(@Param() { account }: AccountParamsDto): Promise<PermissionsModel> {
    const permissions = await this.accountsService.getPermissions(account);
    return createPermissionsModel(permissions);
  }
}
