import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  ConfidentialTransaction,
  ConfidentialVenue,
} from '@polymeshassociation/polymesh-sdk/types';

import { ApiTransactionResponse } from '~/common/decorators/swagger';
import { IdParamsDto } from '~/common/dto/id-params.dto';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { handleServiceResult, TransactionResolver, TransactionResponseModel } from '~/common/utils';
import { ConfidentialTransactionsService } from '~/confidential-transactions/confidential-transactions.service';
import { CreateConfidentialTransactionDto } from '~/confidential-transactions/dto/create-confidential-transaction.dto';
import { CreatedConfidentialTransactionModel } from '~/confidential-transactions/models/created-confidential-transaction.model';
import { CreatedConfidentialVenueModel } from '~/confidential-transactions/models/created-confidential-venue.model';
import { IdentityModel } from '~/identities/models/identity.model';
import { CreatedInstructionModel } from '~/settlements/models/created-instruction.model';

@ApiTags('confidential-venues')
@Controller('confidential-venues')
export class ConfidentialVenuesController {
  constructor(private readonly confidentialTransactionsService: ConfidentialTransactionsService) {}

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
  @Get(':id/creator')
  public async getCreator(@Param() { id }: IdParamsDto): Promise<IdentityModel> {
    const { did } = await this.confidentialTransactionsService.getVenueCreator(id);

    return new IdentityModel({ did });
  }

  @ApiOperation({
    summary: 'Create a Confidential Venue',
    description: 'This endpoint allows for the creation of a new Confidential Venue',
  })
  @ApiTransactionResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @Post('create')
  public async createVenue(@Body() params: TransactionBaseDto): Promise<TransactionResponseModel> {
    const result = await this.confidentialTransactionsService.createConfidentialVenue(params);

    const resolver: TransactionResolver<ConfidentialVenue> = ({
      result: confidentialVenue,
      transactions,
      details,
    }) =>
      new CreatedConfidentialVenueModel({
        confidentialVenue,
        transactions,
        details,
      });

    return handleServiceResult(result, resolver);
  }

  @ApiTags('confidential-transactions')
  @ApiOperation({
    summary: 'Create a new Confidential Transactions',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Confidential Venue',
    type: 'string',
    example: '123',
  })
  @ApiOkResponse({
    description: 'The ID of the newly created Confidential Transaction',
    type: CreatedInstructionModel,
  })
  @Post(':id/transactions/create')
  public async createConfidentialTransaction(
    @Param() { id }: IdParamsDto,
    @Body() createConfidentialTransactionDto: CreateConfidentialTransactionDto
  ): Promise<TransactionResponseModel> {
    const serviceResult = await this.confidentialTransactionsService.createConfidentialTransaction(
      id,
      createConfidentialTransactionDto
    );

    const resolver: TransactionResolver<ConfidentialTransaction> = ({
      result: confidentialTransaction,
      transactions,
      details,
    }) =>
      new CreatedConfidentialTransactionModel({
        confidentialTransaction,
        details,
        transactions,
      });

    return handleServiceResult(serviceResult, resolver);
  }
}
