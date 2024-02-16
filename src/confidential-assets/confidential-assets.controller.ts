import { Body, Controller, Get, HttpStatus, Param, Post, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';

import { TickerParamsDto } from '~/assets/dto/ticker-params.dto';
import { ApiTransactionFailedResponse, ApiTransactionResponse } from '~/common/decorators/swagger';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { handleServiceResult, TransactionResponseModel } from '~/common/utils';
import { ConfidentialAssetsService } from '~/confidential-assets/confidential-assets.service';
import { createConfidentialAssetDetailsModel } from '~/confidential-assets/confidential-assets.util';
import { ConfidentialAssetIdParamsDto } from '~/confidential-assets/dto/confidential-asset-id-params.dto';
import { CreateConfidentialAssetDto } from '~/confidential-assets/dto/create-confidential-asset.dto';
import { IssueConfidentialAssetDto } from '~/confidential-assets/dto/issue-confidential-asset.dto';
import { ConfidentialAssetModel } from '~/confidential-assets/models/confidential-asset.model';
import { ConfidentialAssetDetailsModel } from '~/confidential-assets/models/confidential-asset-details.model';
import { ConfidentialVenueFilteringDetailsModel } from '~/confidential-assets/models/confidential-venue-filtering-details.model';

@ApiTags('confidential-assets')
@Controller('confidential-assets')
export class ConfidentialAssetsController {
  constructor(private readonly confidentialAssetsService: ConfidentialAssetsService) {}

  @ApiOperation({
    summary: 'Fetch Confidential Asset details',
    description:
      'This endpoint will provide the basic details of an Confidential Asset along with the auditors information',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Confidential Asset whose details are to be fetched',
    type: 'string',
    example: '76702175-d8cb-e3a5-5a19-734433351e25',
  })
  @ApiOkResponse({
    description: 'Basic details of the Asset',
    type: ConfidentialAssetDetailsModel,
  })
  @Get(':id')
  public async getDetails(
    @Param() { id }: ConfidentialAssetIdParamsDto
  ): Promise<ConfidentialAssetDetailsModel> {
    const asset = await this.confidentialAssetsService.findOne(id);

    return createConfidentialAssetDetailsModel(asset);
  }

  @ApiOperation({
    summary: 'Search by ticker',
    description: 'This endpoint will return the Confidential Asset mapped to a given ticker',
  })
  @ApiQuery({
    name: 'ticker',
    description: 'The ticker to be searched',
    type: 'string',
    example: 'TICKER',
  })
  @ApiOkResponse({
    description: 'Confidential Asset corresponding to the given ticker',
    type: ConfidentialAssetModel,
  })
  @Get('search')
  public async getAssetByTicker(
    @Query() { ticker }: TickerParamsDto
  ): Promise<ConfidentialAssetModel> {
    const { id } = await this.confidentialAssetsService.findOneByTicker(ticker);

    return new ConfidentialAssetModel({ id });
  }

  @ApiOperation({
    summary: 'Create a Confidential Asset',
    description: 'This endpoint allows for the creation of a new Confidential Asset',
  })
  @ApiTransactionResponse({
    description: 'Details about the transaction',
    type: TransactionQueueModel,
  })
  @ApiUnprocessableEntityResponse({
    description: 'One or more auditors do not exists',
  })
  @Post('create')
  public async createAsset(
    @Body() params: CreateConfidentialAssetDto
  ): Promise<TransactionResponseModel> {
    const result = await this.confidentialAssetsService.createConfidentialAsset(params);
    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Issue more of a Confidential Asset',
    description:
      'This endpoint issues more of a given Confidential Asset into a specified Confidential Account',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Confidential Asset to be issued',
    type: 'string',
    example: '76702175-d8cb-e3a5-5a19-734433351e25',
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.UNPROCESSABLE_ENTITY]: [
      'Amount is not greater than zero',
      'The signer cannot issue the Assets in the given account',
      'Issuance operation will total supply to exceed the supply limit',
    ],
    [HttpStatus.NOT_FOUND]: ['The Confidential Asset does not exists'],
  })
  @Post(':id/issue')
  public async issue(
    @Param() { id }: ConfidentialAssetIdParamsDto,
    @Body() params: IssueConfidentialAssetDto
  ): Promise<TransactionResponseModel> {
    const result = await this.confidentialAssetsService.issue(id, params);
    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Get venue filtering details',
    description: 'This endpoint will return the venue filtering details for a Confidential Asset',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Confidential Asset',
    type: 'string',
    example: '76702175-d8cb-e3a5-5a19-734433351e25',
  })
  @ApiOkResponse({
    description: 'Venue filtering details',
    type: ConfidentialVenueFilteringDetailsModel,
  })
  @Get(':id/venue-filtering')
  public async getVenueFilteringDetails(
    @Param() { id }: ConfidentialAssetIdParamsDto
  ): Promise<ConfidentialVenueFilteringDetailsModel> {
    const details = await this.confidentialAssetsService.getVenueFilteringDetails(id);

    const { enabled, allowedConfidentialVenues } = {
      allowedConfidentialVenues: undefined,
      ...details,
    };

    return new ConfidentialVenueFilteringDetailsModel({ enabled, allowedConfidentialVenues });
  }
}
