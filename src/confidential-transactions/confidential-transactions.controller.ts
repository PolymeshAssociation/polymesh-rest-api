import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { ApiTransactionResponse } from '~/common/decorators/swagger';
import { IdParamsDto } from '~/common/dto/id-params.dto';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { handleServiceResult, TransactionResponseModel } from '~/common/utils';
import { ConfidentialTransactionsService } from '~/confidential-transactions/confidential-transactions.service';
import { createConfidentialTransactionModel } from '~/confidential-transactions/confidential-transactions.util';
import { ConfidentialTransactionModel } from '~/confidential-transactions/models/confidential-transaction.model';
import { IdentityModel } from '~/identities/models/identity.model';

@ApiTags('confidential-transactions')
@Controller('confidential-transactions')
export class ConfidentialTransactionsController {
  constructor(private readonly confidentialTransactionsService: ConfidentialTransactionsService) {}

  @ApiOperation({
    summary: 'Fetch Confidential transaction details',
    description: 'This endpoint will provide the details of a Confidential Transaction',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Confidential Transaction',
    type: 'string',
    example: '123',
  })
  @ApiOkResponse({
    description: 'Details of the Confidential Transaction',
    type: ConfidentialTransactionModel,
  })
  @ApiNotFoundResponse({
    description: 'The Confidential Transaction with the given ID was not found',
  })
  @Get('transactions/:id')
  public async getTransaction(@Param() { id }: IdParamsDto): Promise<ConfidentialTransactionModel> {
    const transaction = await this.confidentialTransactionsService.findOne(id);
    return createConfidentialTransactionModel(transaction);
  }

  @ApiTags('confidential-venue')
  @ApiOperation({
    summary: 'Get creator',
    description: 'This endpoint retrieves the creator of a Confidential Venue',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Confidential Venue',
    type: 'string',
    example: '1',
  })
  @ApiOkResponse({
    description: 'DID of the creator of the Confidential Venue',
    type: IdentityModel,
  })
  @Get('/venues/:id/creator')
  public async getCreator(@Param() { id }: IdParamsDto): Promise<IdentityModel> {
    const { did } = await this.confidentialTransactionsService.getCreator(id);

    return new IdentityModel({ did });
  }

  @ApiTags('confidential-venue')
  @ApiOperation({
    summary: 'Create a Confidential Venue',
    description: 'This endpoint allows for the creation of a new Confidential Venue',
  })
  @ApiTransactionResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @Post('venues/create')
  public async createAccount(
    @Body() params: TransactionBaseDto
  ): Promise<TransactionResponseModel> {
    const result = await this.confidentialTransactionsService.createConfidentialVenue(params);
    return handleServiceResult(result);
  }
}
