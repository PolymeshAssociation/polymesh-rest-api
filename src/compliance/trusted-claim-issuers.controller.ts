import { Body, Controller, Get, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { TickerParamsDto } from '~/assets/dto/ticker-params.dto';
import {
  ApiArrayResponse,
  ApiTransactionFailedResponse,
  ApiTransactionResponse,
} from '~/common/decorators/swagger';
import { ResultsModel } from '~/common/models/results.model';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { handleServiceResult, TransactionResponseModel } from '~/common/utils';
import { RemoveTrustedClaimIssuers } from '~/compliance/dto/remove-trusted-claim-issuers.dto';
import { SetTrustedClaimIssuers } from '~/compliance/dto/set-trusted-claim-issuers.dto';
import { TrustedClaimIssuerModel } from '~/compliance/models/trusted-claim-issuer.model';
import { TrustedClaimIssuersService } from '~/compliance/trusted-claim-issuers.service';

@ApiTags('assets', 'compliance')
@Controller('assets/:ticker/trusted-claim-issuers')
export class TrustedClaimIssuersController {
  constructor(private readonly trustedClaimIssuersService: TrustedClaimIssuersService) {}

  @ApiOperation({
    summary: 'Fetch trusted Claim Issuers of an Asset',
    description:
      'This endpoint will provide the list of all default trusted Claim Issuers of an Asset',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset whose trusted Claim Issuers are to be fetched',
    type: 'string',
    example: 'TICKER',
  })
  @ApiArrayResponse(TrustedClaimIssuerModel, {
    description: 'List of trusted Claim Issuers of the Asset',
    paginated: false,
  })
  @Get('')
  public async getTrustedClaimIssuers(
    @Param() { ticker }: TickerParamsDto
  ): Promise<ResultsModel<TrustedClaimIssuerModel>> {
    const results = await this.trustedClaimIssuersService.find(ticker);
    return new ResultsModel({
      results: results.map(
        ({ identity: { did }, trustedFor }) => new TrustedClaimIssuerModel({ did, trustedFor })
      ),
    });
  }

  @ApiOperation({
    summary: 'Set trusted Claim Issuers of an Asset',
    description: 'This endpoint will set default trusted Claim Issuers of an Asset',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset whose trusted Claim Issuers are to be set',
    type: 'string',
    example: 'TICKER',
  })
  @ApiTransactionResponse({
    description: 'Details of the transaction',
    type: TransactionQueueModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.NOT_FOUND]: ['Asset was not found', 'Some of the supplied Identities do not exist'],
    [HttpStatus.BAD_REQUEST]: 'The supplied claim issuer list is equal to the current one',
  })
  @Post('set')
  public async setTrustedClaimIssuers(
    @Param() { ticker }: TickerParamsDto,
    @Body() params: SetTrustedClaimIssuers
  ): Promise<TransactionResponseModel> {
    const result = await this.trustedClaimIssuersService.set(ticker, params);

    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Add trusted Claim Issuers of an Asset',
    description: 'This endpoint will add trusted Claim Issuers for an Asset',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset whose trusted Claim Issuers are to be added',
    type: 'string',
    example: 'TICKER',
  })
  @ApiTransactionResponse({
    description: 'Details of the transaction',
    type: TransactionQueueModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.NOT_FOUND]: ['Asset was not found', 'Some of the supplied Identities do not exist'],
    [HttpStatus.UNPROCESSABLE_ENTITY]:
      'One or more of the supplied Identities already are Trusted Claim Issuers',
  })
  @Post('add')
  public async addTrustedClaimIssuers(
    @Param() { ticker }: TickerParamsDto,
    @Body() params: SetTrustedClaimIssuers
  ): Promise<TransactionResponseModel> {
    const result = await this.trustedClaimIssuersService.add(ticker, params);

    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Remove trusted Claim Issuers of an Asset',
    description: 'This endpoint will remove trusted Claim Issuers for an Asset',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset whose trusted Claim Issuers are to be removed',
    type: 'string',
    example: 'TICKER',
  })
  @ApiTransactionResponse({
    description: 'Details of the transaction',
    type: TransactionQueueModel,
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.NOT_FOUND]: ['Asset was not found', 'Some of the supplied Identities do not exist'],
    [HttpStatus.UNPROCESSABLE_ENTITY]:
      'One or more of the supplied Identities are not Trusted Claim Issuers',
  })
  @Post('remove')
  public async removeTrustedClaimIssuers(
    @Param() { ticker }: TickerParamsDto,
    @Body() params: RemoveTrustedClaimIssuers
  ): Promise<TransactionResponseModel> {
    const result = await this.trustedClaimIssuersService.remove(ticker, params);

    return handleServiceResult(result);
  }
}
