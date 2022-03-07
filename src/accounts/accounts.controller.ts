import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { AccountsService } from '~/accounts/accounts.service';
import { AccountParamsDto } from '~/accounts/dto/account-params.dto';
import { BalanceModel } from '~/assets/models/balance.model';

@ApiTags('accounts')
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get(':account/balance')
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
    description: 'Returns free, locked and total POLYX balance',
    type: BalanceModel,
  })
  async getAccountBalance(@Param() { account }: AccountParamsDto): Promise<BalanceModel> {
    const accountBalance = await this.accountsService.getAccountBalance(account);
    return new BalanceModel(accountBalance);
  }
}
