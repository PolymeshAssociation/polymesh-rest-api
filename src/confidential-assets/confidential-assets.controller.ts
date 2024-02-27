import { Body, Controller, Get, HttpStatus, Param, Post } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ConfidentialAsset } from '@polymeshassociation/polymesh-sdk/types';

import { ApiTransactionFailedResponse, ApiTransactionResponse } from '~/common/decorators/swagger';
import { handleServiceResult, TransactionResolver, TransactionResponseModel } from '~/common/utils';
import { ConfidentialAssetsService } from '~/confidential-assets/confidential-assets.service';
import { createConfidentialAssetDetailsModel } from '~/confidential-assets/confidential-assets.util';
import { ConfidentialAssetIdParamsDto } from '~/confidential-assets/dto/confidential-asset-id-params.dto';
import { CreateConfidentialAssetDto } from '~/confidential-assets/dto/create-confidential-asset.dto';
import { IssueConfidentialAssetDto } from '~/confidential-assets/dto/issue-confidential-asset.dto';
import { SetConfidentialVenueFilteringParamsDto } from '~/confidential-assets/dto/set-confidential-venue-filtering-params.dto';
import { ConfidentialAssetDetailsModel } from '~/confidential-assets/models/confidential-asset-details.model';
import { ConfidentialVenueFilteringDetailsModel } from '~/confidential-assets/models/confidential-venue-filtering-details.model';
import { CreatedConfidentialAssetModel } from '~/confidential-assets/models/created-confidential-asset.model';

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
    summary: 'Create a Confidential Asset',
    description: 'This endpoint allows for the creation of a new Confidential Asset',
  })
  @ApiTransactionResponse({
    description: 'Details about the newly created Confidential Asset',
    type: CreatedConfidentialAssetModel,
  })
  @ApiUnprocessableEntityResponse({
    description: 'One or more auditors do not exists',
  })
  @Post('create')
  public async createConfidentialAsset(
    @Body() params: CreateConfidentialAssetDto
  ): Promise<TransactionResponseModel> {
    const result = await this.confidentialAssetsService.createConfidentialAsset(params);

    const resolver: TransactionResolver<ConfidentialAsset> = ({
      result: confidentialAsset,
      transactions,
      details,
    }) =>
      new CreatedConfidentialAssetModel({
        confidentialAsset,
        details,
        transactions,
      });

    return handleServiceResult(result, resolver);
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
  public async issueConfidentialAsset(
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

  @ApiOperation({
    summary: 'Set confidential Venue filtering',
    description:
      'This endpoint enables/disables confidential venue filtering for a given Confidential Asset and/or set allowed/disallowed Confidential Venues',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Confidential Asset',
    type: 'string',
    example: '76702175-d8cb-e3a5-5a19-734433351e25',
  })
  @ApiTransactionFailedResponse({
    [HttpStatus.NOT_FOUND]: ['The Confidential Asset does not exists'],
  })
  @Post(':id/venue-filtering')
  public async setConfidentialVenueFiltering(
    @Param() { id }: ConfidentialAssetIdParamsDto,
    @Body() params: SetConfidentialVenueFilteringParamsDto
  ): Promise<TransactionResponseModel> {
    const result = await this.confidentialAssetsService.setVenueFilteringDetails(id, params);

    return handleServiceResult(result);
  }
}
