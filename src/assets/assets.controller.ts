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
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';

import { AssetsService } from '~/assets/assets.service';
import { createAssetDetailsModel } from '~/assets/assets.util';
import { CreateAssetDto } from '~/assets/dto/create-asset.dto';
import { IssueDto } from '~/assets/dto/issue.dto';
import { SetAssetDocumentsDto } from '~/assets/dto/set-asset-documents.dto';
import { TickerParamsDto } from '~/assets/dto/ticker-params.dto';
import { AssetDetailsModel } from '~/assets/models/asset-details.model';
import { AssetDocumentModel } from '~/assets/models/asset-document.model';
import { IdentityBalanceModel } from '~/assets/models/identity-balance.model';
import { ApiArrayResponse } from '~/common/decorators/swagger';
import { PaginatedParamsDto } from '~/common/dto/paginated-params.dto';
import { SignerDto } from '~/common/dto/signer.dto';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { ResultsModel } from '~/common/models/results.model';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { ComplianceService } from '~/compliance/compliance.service';
import { TrustedClaimIssuerModel } from '~/compliance/models/trusted-claim-issuer.model';

@ApiTags('assets')
@Controller('assets')
export class AssetsController {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly complianceService: ComplianceService
  ) {}

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
    type: 'string',
    required: false,
    example: '10',
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
            identity: identity.did,
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
    type: 'string',
    required: false,
    example: '10',
  })
  @ApiQuery({
    name: 'start',
    description: 'Start key from which documents are to be fetched',
    type: 'string',
    required: false,
    example: 'START_KEY',
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
    summary: 'Set a list of Documents for an Asset',
    description:
      'This endpoint assigns a new list of Documents to the Asset by replacing the existing list of Documents with the ones passed in the body',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset whose documents are to be updated',
    type: 'string',
    example: 'TICKER',
  })
  @ApiOkResponse({
    description: 'Details of the transaction',
  })
  @ApiNotFoundResponse({
    description: 'Asset was not found',
  })
  @ApiBadRequestResponse({
    description: 'The supplied Document list is equal to the current one',
  })
  @Post(':ticker/set-documents')
  public async setDocuments(
    @Param() { ticker }: TickerParamsDto,
    @Body() setAssetDocumentsDto: SetAssetDocumentsDto
  ): Promise<TransactionQueueModel> {
    const { transactions } = await this.assetsService.setDocuments(ticker, setAssetDocumentsDto);
    return new TransactionQueueModel({ transactions });
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
    const results = await this.complianceService.findTrustedClaimIssuers(ticker);
    return new ResultsModel({
      results: results.map(
        ({ identity: { did }, trustedFor }) => new TrustedClaimIssuerModel({ did, trustedFor })
      ),
    });
  }

  @ApiOperation({
    summary: 'Issue more of an Asset',
    description: 'This endpoint issues more of a given Asset',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset to issue',
    type: 'string',
    example: 'TICKER',
  })
  @ApiCreatedResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @ApiNotFoundResponse({
    description: 'The Asset does not exist',
  })
  @Post(':ticker/issue')
  public async issue(
    @Param() { ticker }: TickerParamsDto,
    @Body() params: IssueDto
  ): Promise<TransactionQueueModel> {
    const { transactions } = await this.assetsService.issue(ticker, params);
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
  @Post('create-asset')
  public async createAsset(@Body() params: CreateAssetDto): Promise<TransactionQueueModel> {
    const { transactions } = await this.assetsService.createAsset(params);
    return new TransactionQueueModel({ transactions });
  }

  @ApiOperation({
    summary: 'Freeze transfers for an Asset',
    description:
      'This endpoint submits a transaction that causes the Asset to become frozen. This means that it cannot be transferred or minted until it is unfrozen',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset to freeze',
    type: 'string',
    example: 'TICKER',
  })
  @ApiCreatedResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @ApiNotFoundResponse({
    description: 'The Asset does not exist',
  })
  @ApiUnprocessableEntityResponse({
    description: 'The asset is already frozen',
  })
  @Post(':ticker/freeze')
  public async freeze(
    @Param() { ticker }: TickerParamsDto,
    @Body() params: SignerDto
  ): Promise<TransactionQueueModel> {
    const { transactions } = await this.assetsService.freeze(ticker, params);
    return new TransactionQueueModel({ transactions });
  }

  @ApiOperation({
    summary: 'Freeze transfers for an Asset',
    description:
      'This endpoint submits a transaction that unfreezes the Asset. This means that transfers and minting can be performed until it is frozen again',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset to unfreeze',
    type: 'string',
    example: 'TICKER',
  })
  @ApiCreatedResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @ApiNotFoundResponse({
    description: 'The Asset does not exist',
  })
  @ApiUnprocessableEntityResponse({
    description: 'The asset is already unfrozen',
  })
  @Post(':ticker/unfreeze')
  public async unfreeze(
    @Param() { ticker }: TickerParamsDto,
    @Body() params: SignerDto
  ): Promise<TransactionQueueModel> {
    const { transactions } = await this.assetsService.unfreeze(ticker, params);
    return new TransactionQueueModel({ transactions });
  }
}
