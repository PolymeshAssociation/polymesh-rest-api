import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { ApiTransactionResponse } from '~/common/decorators/swagger';
import { IdParamsDto } from '~/common/dto/id-params.dto';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { handleServiceResult, TransactionResponseModel } from '~/common/utils';
import { ConfidentialTransactionsService } from '~/confidential-transactions/confidential-transactions.service';
import { IdentityModel } from '~/identities/models/identity.model';

@ApiTags('confidential-venues')
@Controller('confidential-venues')
export class ConfidentialVenuesController {
  constructor(private readonly confidentialTransactionsService: ConfidentialTransactionsService) {}

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
    return handleServiceResult(result);
  }
}
