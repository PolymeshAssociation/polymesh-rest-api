import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';

import { ApiTransactionResponse } from '~/common/decorators/swagger';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { handleServiceResult, TransactionResponseModel } from '~/common/utils';
import { ConfidentialAccountsService } from '~/confidential-accounts/confidential-accounts.service';
import { CreateConfidentialAccountDto } from '~/confidential-accounts/dto/create-confidential-account.dto';
import { ConfidentialAccountModel } from '~/confidential-accounts/models/confidential-account.model';
import { IdentityModel } from '~/identities/models/identity.model';

@Controller('confidential-accounts')
export class ConfidentialAccountsController {
  constructor(private readonly confidentialAccountsService: ConfidentialAccountsService) {}

  @ApiOperation({
    summary: 'Get owner',
    description: 'This endpoint retire',
  })
  @ApiParam({
    name: 'publicKey',
    description: 'The public key of the Confidential Account',
    type: 'string',
    example: '0x',
  })
  @ApiOkResponse({
    description: 'DID of the owner of the Confidential Account',
    type: IdentityModel,
  })
  @Get(':publicKey')
  public async getDetails(
    @Param() { publicKey }: ConfidentialAccountModel
  ): Promise<IdentityModel> {
    const { did } = await this.confidentialAccountsService.fetchOwner(publicKey);

    return new IdentityModel({ did });
  }

  @ApiOperation({
    summary: 'Create a Confidential Account',
    description: 'This endpoint allows for the creation of a new Confidential Account',
  })
  @ApiTransactionResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @Post('create')
  public async createAccount(
    @Body() params: CreateConfidentialAccountDto
  ): Promise<TransactionResponseModel> {
    const result = await this.confidentialAccountsService.createConfidentialAccount(params);
    return handleServiceResult(result);
  }
}
