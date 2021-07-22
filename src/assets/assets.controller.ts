import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

import { AssetsService } from '~/assets/assets.service';
import { AssetDetailsModel } from '~/assets/models/asset-details.model';
import { AssetDocumentModel } from '~/assets/models/asset-document.model';
import { AssetIdentifierModel } from '~/assets/models/asset-identifier.model';
import { IdentityBalanceModel } from '~/assets/models/identity-balance.model';
import { RequirementModel } from '~/assets/models/requirement.model';
import { ApiArrayResponse } from '~/common/decorators/swagger';
import { IsTicker } from '~/common/decorators/validation';
import { PaginatedParamsDto } from '~/common/dto/paginated-params.dto';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { ResultsModel } from '~/common/models/results.model';

class TickerParams {
  @IsTicker()
  readonly ticker: string;
}

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
    description: 'The unique ticker whose details are to be fetched',
    type: 'string',
    example: 'TICKER',
  })
  @ApiOkResponse({
    description: 'Returns basic details of the Asset',
    type: AssetDetailsModel,
  })
  @Get(':ticker')
  public async getDetails(@Param() { ticker }: TickerParams): Promise<AssetDetailsModel> {
    const {
      owner,
      assetType,
      name,
      totalSupply,
      isDivisible,
    } = await this.assetsService.findDetails(ticker);

    return new AssetDetailsModel({
      owner,
      assetType,
      name,
      totalSupply,
      isDivisible,
    });
  }

  @ApiOperation({
    summary: 'Fetch Asset Identifiers',
    description: 'This endpoint will provide the list of Asset Identifiers',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The unique ticker whose identifiers are to be fetched',
    type: 'string',
    example: 'TICKER',
  })
  @ApiArrayResponse(AssetIdentifierModel, {
    description: 'Returns the list of Asset identifiers',
    example: [
      {
        type: 'Isin',
        value: 'US0000000000',
      },
    ],
    paginated: false,
  })
  @Get(':ticker/identifiers')
  public async getIdentifiers(
    @Param() { ticker }: TickerParams
  ): Promise<ResultsModel<AssetIdentifierModel>> {
    const results = await this.assetsService.findIdentifiers(ticker);
    return new ResultsModel({
      results: results.map(assetIdentifier => new AssetIdentifierModel(assetIdentifier)),
    });
  }

  @ApiOperation({
    summary: 'Fetch a list of Asset holders',
    description:
      'This endpoint will provide the list of Asset holders along with their current balance',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The unique ticker whose details are to be fetched',
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
    description:
      'Returns the list of Asset holders, each consisting of their existing Asset balance',
    paginated: true,
  })
  @Get(':ticker/holders')
  public async getAssetHolders(
    @Param() { ticker }: TickerParams,
    @Query() { size, start }: PaginatedParamsDto
  ): Promise<PaginatedResultsModel<IdentityBalanceModel>> {
    const { data, count: total, next } = await this.assetsService.findAssetHolders(
      ticker,
      size,
      start?.toString()
    );

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
    description: 'The unique ticker whose attached documents are to be fetched',
    type: 'string',
    example: 'TICKER',
  })
  @ApiQuery({
    name: 'size',
    description: 'The number of documents to be fetched',
    type: 'number',
    required: false,
  })
  @ApiQuery({
    name: 'start',
    description: 'Start key from which documents are to be fetched',
    type: 'string',
    required: false,
  })
  @ApiArrayResponse(AssetDocumentModel, {
    description: 'Returns the documents attached to the Asset',
    paginated: true,
  })
  @Get(':ticker/documents')
  public async getAssetDocuments(
    @Param() { ticker }: TickerParams,
    @Query() { size, start }: PaginatedParamsDto
  ): Promise<PaginatedResultsModel<AssetDocumentModel>> {
    const { data, count: total, next } = await this.assetsService.findDocuments(
      ticker,
      size,
      start?.toString()
    );

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
    description: 'This endpoint will provide the list of all compliance requirements ',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The unique ticker whose compliance requirements are to be fetched',
    type: 'string',
    example: 'TICKER',
  })
  @ApiArrayResponse(RequirementModel, {
    description: 'Returns the list of compliance requirements for the Asset',
    paginated: false,
  })
  @Get(':ticker/compliance-requirements')
  public async getComplianceRequirements(
    @Param() { ticker }: TickerParams
  ): Promise<ResultsModel<RequirementModel>> {
    const results = await this.assetsService.findComplianceRequirements(ticker);

    return new ResultsModel({
      results: results.map(({ id, conditions }) => new RequirementModel({ id, conditions })),
    });
  }
}
