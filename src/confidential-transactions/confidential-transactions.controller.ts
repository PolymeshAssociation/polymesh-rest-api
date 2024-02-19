import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { IdParamsDto } from '~/common/dto/id-params.dto';
import { ConfidentialTransactionsService } from '~/confidential-transactions/confidential-transactions.service';
import { createConfidentialTransactionModel } from '~/confidential-transactions/confidential-transactions.util';
import { ConfidentialTransactionModel } from '~/confidential-transactions/models/confidential-transaction.model';

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
}
