import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { AccountsService } from '~/accounts/accounts.service';
import { AccountParamsDto } from '~/accounts/dto/account-params.dto';
import { TransferPolyxDto } from '~/accounts/dto/transfer-polyx.dto';
import { BalanceModel } from '~/assets/models/balance.model';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { createTransactionQueueModel } from '~/common/utils';

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
    required: true,
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
  @ApiCreatedResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @Post('transfer')
  async transferPolyx(@Body() params: TransferPolyxDto): Promise<TransactionQueueModel> {
    const { transactions } = await this.accountsService.transferPolyx(params);
    return new TransactionQueueModel({ transactions: createTransactionQueueModel(transactions) });
  }
}
