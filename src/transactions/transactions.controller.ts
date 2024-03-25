import { Body, Controller, Get, HttpStatus, NotFoundException, Param, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { ApiTransactionFailedResponse } from '~/common/decorators/swagger';
import { NetworkService } from '~/network/network.service';
import { TransactionDto } from '~/transactions/dto/transaction.dto';
import { TransactionHashParamsDto } from '~/transactions/dto/transaction-hash-params.dto';
import { ExtrinsicDetailsModel } from '~/transactions/models/extrinsic-details.model';
import { SubmitResultModel } from '~/transactions/models/submit-result.model';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly networkService: NetworkService) {}

  @ApiOperation({
    summary: 'Get transaction details using hash',
    description:
      'This endpoint will provide details of the transaction filtered by its hash. This requires Polymesh GraphQL Middleware Service',
  })
  @ApiParam({
    name: 'hash',
    description: 'Hash of the transaction whose details are to be fetched',
    type: 'string',
    example: '0xf36f83c943cbc7d915d52be502d52cdb04c7eacd13a2bea6e17ea37bf1e49224',
  })
  @ApiOkResponse({
    description: 'Details of the transaction',
    type: ExtrinsicDetailsModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.BAD_REQUEST]: ['Given hash is not hexadecimal'],
    [HttpStatus.NOT_FOUND]: ['Transaction does not exist'],
  })
  @Get(':hash/details')
  public async getTransactionByHash(
    @Param() { hash }: TransactionHashParamsDto
  ): Promise<ExtrinsicDetailsModel> {
    const result = await this.networkService.getTransactionByHash(hash);

    if (!result) {
      throw new NotFoundException("Transaction doesn't exists for given hash");
    }

    return new ExtrinsicDetailsModel(result);
  }

  @ApiOperation({
    summary: 'Submit an offline transaction with its signature',
    description:
      'This endpoint allows for a transaction that has been signed offline to be submitted with its signature. For example when the transaction was made from using the option `processMode: "offline"`, this endpoint will attach the signature and forward it to the chain',
  })
  @ApiOkResponse({
    description: 'Information about the block the transaction was included in',
    type: SubmitResultModel,
  })
  @Post('/submit')
  public async submitTransaction(@Body() transaction: TransactionDto): Promise<SubmitResultModel> {
    return this.networkService.submitTransaction(transaction);
  }
}
