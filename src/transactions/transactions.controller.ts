import { Controller, Get, HttpStatus, Param, Res } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { NetworkService } from '~/network/network.service';
import { TransactionHashParamsDto } from '~/transactions/dto/transaction-hash-params.dto';
import { ExtrinsicDetailsModel } from '~/transactions/models/extrinsic-details.model';

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
    example: 'f36f83c943cbc7d915d52be502d52cdb04c7eacd13a2bea6e17ea37bf1e49224',
  })
  @ApiOkResponse({
    description: 'Details of the transaction',
    type: ExtrinsicDetailsModel,
  })
  @Get(':hash/details')
  public async getTransactionByHash(
    @Param() { hash }: TransactionHashParamsDto,
    @Res() res: Response
  ): Promise<void> {
    const result = await this.networkService.getTransactionByHash(hash);

    if (result) {
      res.status(HttpStatus.OK).json(new ExtrinsicDetailsModel(result));
    } else {
      res.status(HttpStatus.NO_CONTENT).send({});
    }
  }
}
