import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { IdParamsDto } from '~/common/dto/id-params.dto';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { handleServiceResult, TransactionResponseModel } from '~/common/utils';
import { ConfidentialTransactionsService } from '~/confidential-transactions/confidential-transactions.service';
import { createConfidentialTransactionModel } from '~/confidential-transactions/confidential-transactions.util';
import { ObserverAffirmConfidentialTransactionDto } from '~/confidential-transactions/dto/observer-affirm-confidential-transaction.dto';
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
  @Get(':id')
  public async getDetails(@Param() { id }: IdParamsDto): Promise<ConfidentialTransactionModel> {
    const transaction = await this.confidentialTransactionsService.findOne(id);
    return createConfidentialTransactionModel(transaction);
  }

  @ApiOperation({
    summary: 'Affirm a leg of an existing Confidential Transaction as a Receiver/Mediator',
    description:
      'This endpoint will affirm a specific leg of a pending Confidential Transaction as a Receiver/Mediator. Note, a mediator/receiver can only affirm a confidential transaction when the sender has already affirmed it. All owners of involved portfolios must affirm for the Confidential Transaction to be executed',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Confidential Transaction to be affirmed',
    type: 'string',
    example: '123',
  })
  @ApiOkResponse({
    description: 'Details of the transaction',
    type: TransactionQueueModel,
  })
  @Post(':id/affirm-leg/observer')
  public async observerAffirmLeg(
    @Param() { id }: IdParamsDto,
    @Body() body: ObserverAffirmConfidentialTransactionDto
  ): Promise<TransactionResponseModel> {
    const result = await this.confidentialTransactionsService.observerAffirmLeg(id, body);
    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Reject a Confidential Transaction',
    description: 'This endpoint will reject a Confidential Transaction',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Confidential Transaction to be rejected',
    type: 'string',
    example: '123',
  })
  @ApiOkResponse({
    description: 'Details of the transaction',
    type: TransactionQueueModel,
  })
  @Post(':id/reject')
  public async rejectConfidentialTransaction(
    @Param() { id }: IdParamsDto,
    @Body() signerDto: TransactionBaseDto
  ): Promise<TransactionResponseModel> {
    const result = await this.confidentialTransactionsService.rejectTransaction(id, signerDto);
    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Execute a Confidential Transaction',
    description:
      'This endpoint will execute a Confidential Transaction already affirmed by all the involved parties',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Confidential Transaction to be executed',
    type: 'string',
    example: '123',
  })
  @ApiOkResponse({
    description: 'Details of the transaction',
    type: TransactionQueueModel,
  })
  @Post(':id/execute')
  public async executeConfidentialTransaction(
    @Param() { id }: IdParamsDto,
    @Body() signerDto: TransactionBaseDto
  ): Promise<TransactionResponseModel> {
    const result = await this.confidentialTransactionsService.executeTransaction(id, signerDto);
    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Get list of all involved parties',
    description:
      'This endpoint will return a list of all identities involved in a given Confidential Transaction',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Confidential Transaction',
    type: 'string',
    example: '123',
  })
  @ApiOkResponse({
    description: 'List of DIDs of the involved parties',
    type: IdentityModel,
    isArray: true,
  })
  @ApiNotFoundResponse({
    description: 'No involved parties were found for the given Confidential Transaction',
  })
  @Get(':id/involved-parties')
  public async getInvolvedParties(@Param() { id }: IdParamsDto): Promise<IdentityModel[]> {
    const result = await this.confidentialTransactionsService.getInvolvedParties(id);

    return result.map(({ did }) => new IdentityModel({ did }));
  }
}
