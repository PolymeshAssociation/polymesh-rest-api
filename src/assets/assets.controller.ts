import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiGoneResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { AssetsService } from '~/assets/assets.service';
import { createAssetDetailsModel } from '~/assets/assets.util';
import { CreateAssetDto } from '~/assets/dto/create-asset.dto';
import { ReserveTickerDto } from '~/assets/dto/reserve-ticker.dto';
import { TickerParamsDto } from '~/assets/dto/ticker-params.dto';
import { AssetDetailsModel } from '~/assets/models/asset-details.model';
import { AssetDocumentModel } from '~/assets/models/asset-document.model';
import { IdentityBalanceModel } from '~/assets/models/identity-balance.model';
import { RequirementModel } from '~/assets/models/requirement.model';
import { TrustedClaimIssuerModel } from '~/assets/models/trusted-claim-issuer.model';
import { ApiArrayResponse } from '~/common/decorators/swagger';
import { PaginatedParamsDto } from '~/common/dto/paginated-params.dto';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { ResultsModel } from '~/common/models/results.model';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';

@ApiTags('assets')
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @ApiOperation({
    summary: 'Fetch Asset details',
    description: 'This endpoint will provide the basic details of an Asset',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset whose details are to be fetched',
    type: 'string',
    example: 'TICKER',
  })
  @ApiOkResponse({
    description: 'Basic details of the Asset',
    type: AssetDetailsModel,
  })
  @Get(':ticker')
  public async getDetails(@Param() { ticker }: TickerParamsDto): Promise<AssetDetailsModel> {
    const asset = await this.assetsService.findOne(ticker);
    return createAssetDetailsModel(asset);
  }

  @ApiOperation({
    summary: 'Fetch a list of Asset holders',
    description:
      'This endpoint will provide the list of Asset holders along with their current balance',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset whose holders are to be fetched',
    type: 'string',
    example: 'TICKER',
  })
  @ApiQuery({
    name: 'size',
    description: 'The number of Asset holders to be fetched',
    type: 'number',
    required: false,
  })
  @ApiQuery({
    name: 'start',
    description: 'Start key from which Asset holders are to be fetched',
    type: 'string',
    required: false,
  })
  @ApiArrayResponse(IdentityBalanceModel, {
    description: 'List of Asset holders, each consisting of a DID and their current Asset balance',
    paginated: true,
  })
  @Get(':ticker/holders')
  public async getHolders(
    @Param() { ticker }: TickerParamsDto,
    @Query() { size, start }: PaginatedParamsDto
  ): Promise<PaginatedResultsModel<IdentityBalanceModel>> {
    const {
      data,
      count: total,
      next,
    } = await this.assetsService.findHolders(ticker, size, start?.toString());

    return new PaginatedResultsModel({
      results: data.map(
        ({ identity, balance }) =>
          new IdentityBalanceModel({
            identity,
            balance,
          })
      ),
      total,
      next,
    });
  }

  @ApiOperation({
    summary: 'Fetch a list of Asset documents',
    description: 'This endpoint will provide the list of documents attached to an Asset',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset whose attached documents are to be fetched',
    type: 'string',
    example: 'TICKER',
  })
  @ApiQuery({
    name: 'size',
    description: 'The number of documents to be fetched',
    type: 'number',
    required: false,
    example: 10,
  })
  @ApiQuery({
    name: 'start',
    description: 'Start key from which documents are to be fetched',
    type: 'string',
    required: false,
    example: 'STARTKEY',
  })
  @ApiArrayResponse(AssetDocumentModel, {
    description: 'List of documents attached to the Asset',
    paginated: true,
  })
  @Get(':ticker/documents')
  public async getDocuments(
    @Param() { ticker }: TickerParamsDto,
    @Query() { size, start }: PaginatedParamsDto
  ): Promise<PaginatedResultsModel<AssetDocumentModel>> {
    const {
      data,
      count: total,
      next,
    } = await this.assetsService.findDocuments(ticker, size, start?.toString());

    return new PaginatedResultsModel({
      results: data.map(
        ({ name, uri, contentHash, type, filedAt }) =>
          new AssetDocumentModel({
            name,
            uri,
            contentHash,
            type,
            filedAt,
          })
      ),
      total,
      next,
    });
  }

  @ApiOperation({
    summary: 'Fetch compliance requirements for an Asset',
    description: 'This endpoint will provide the list of all compliance requirements of an Asset',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset whose compliance requirements are to be fetched',
    type: 'string',
    example: 'TICKER',
  })
  @ApiArrayResponse(RequirementModel, {
    description: 'List of compliance requirements of the Asset',
    paginated: false,
  })
  @Get(':ticker/compliance-requirements')
  public async getComplianceRequirements(
    @Param() { ticker }: TickerParamsDto
  ): Promise<ResultsModel<RequirementModel>> {
    const results = await this.assetsService.findComplianceRequirements(ticker);

    return new ResultsModel({
      results: results.map(({ id, conditions }) => new RequirementModel({ id, conditions })),
    });
  }

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
  @Get(':ticker/trusted-claim-issuers')
  public async getTrustedClaimIssuers(
    @Param() { ticker }: TickerParamsDto
  ): Promise<ResultsModel<TrustedClaimIssuerModel>> {
    const results = await this.assetsService.findTrustedClaimIssuers(ticker);
    return new ResultsModel({
      results: results.map(
        ({ did, trustedFor }) =>
          // TODO @monitz87 remove the below null conversion once updated in SDK
          new TrustedClaimIssuerModel({ did, trustedFor: trustedFor || null })
      ),
    });
  }

  @ApiOperation({
    summary: 'Reserve a Ticker',
    description: 'Reserves a ticker so that an Asset can be created with it later',
  })
  @ApiCreatedResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @ApiBadRequestResponse({
    description: 'The ticker has already been reserved',
  })
  @Post('/reservations/tickers')
  public async registerTicker(@Body() params: ReserveTickerDto): Promise<TransactionQueueModel> {
    const { transactions } = await this.assetsService.registerTicker(params);
    return new TransactionQueueModel({ transactions });
  }

  @ApiOperation({
    summary: 'Create an Asset',
    description: 'This endpoint allows for the creation of new assets',
  })
  @ApiCreatedResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @ApiNotFoundResponse({
    description: 'The ticker reservation does not exist',
  })
  @ApiGoneResponse({
    description: 'The ticker has already been used to create an asset',
  })
  @Post('')
  public async createAsset(@Body() params: CreateAssetDto): Promise<TransactionQueueModel> {
    const { transactions } = await this.assetsService.createAsset(params);
    return new TransactionQueueModel({ transactions });
  }
}
