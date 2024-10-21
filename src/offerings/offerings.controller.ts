import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  OfferingBalanceStatus,
  OfferingSaleStatus,
  OfferingTimingStatus,
} from '@polymeshassociation/polymesh-sdk/types';

import { AssetParamsDto } from '~/assets/dto/asset-params.dto';
import { ApiArrayResponse } from '~/common/decorators/swagger';
import { IsAsset } from '~/common/decorators/validation';
import { IdParamsDto } from '~/common/dto/id-params.dto';
import { PaginatedParamsDto } from '~/common/dto/paginated-params.dto';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { ResultsModel } from '~/common/models/results.model';
import { OfferingStatusFilterDto } from '~/offerings/dto/offering-status-filter.dto';
import { InvestmentModel } from '~/offerings/models/investment.model';
import { OfferingDetailsModel } from '~/offerings/models/offering-details.model';
import { OfferingsService } from '~/offerings/offerings.service';
import { createOfferingDetailsModel } from '~/offerings/offerings.util';

class OfferingParams extends IdParamsDto {
  @IsAsset()
  readonly asset: string;
}

@ApiTags('offerings')
@Controller('assets/:asset/offerings')
export class OfferingsController {
  constructor(private readonly offeringsService: OfferingsService) {}

  @ApiTags('assets')
  @ApiOperation({
    summary: 'Fetch Asset Offerings for an Asset',
    description: 'This endpoint will provide the list of all Asset Offerings for an Asset',
  })
  @ApiParam({
    name: 'asset',
    description: 'The Asset (Ticker/Asset ID) whose Offerings are to be fetched',
    type: 'string',
    example: 'TICKER',
  })
  @ApiQuery({
    name: 'timing',
    description: 'Timing status by which to filter Offerings',
    enum: OfferingTimingStatus,
    required: false,
  })
  @ApiQuery({
    name: 'balance',
    description: 'Balance status by which to filter Offerings',
    enum: OfferingBalanceStatus,
    required: false,
  })
  @ApiQuery({
    name: 'sale',
    description: 'Sale status by which to filter Offerings',
    enum: OfferingSaleStatus,
    required: false,
  })
  @ApiArrayResponse(OfferingDetailsModel, {
    description: 'List of Offerings for this Asset',
    paginated: false,
  })
  @Get()
  public async getOfferings(
    @Param() { asset }: AssetParamsDto,
    @Query() { timing, balance, sale }: OfferingStatusFilterDto
  ): Promise<ResultsModel<OfferingDetailsModel>> {
    const offerings = await this.offeringsService.findAllByAsset(asset, {
      timing,
      balance,
      sale,
    });
    return new ResultsModel({
      results: offerings.map(offering => createOfferingDetailsModel(offering)),
    });
  }

  @ApiOperation({
    summary: 'List Investments made in an Offering',
    description:
      'This endpoint will return a list of Investments made in an Offering for a given Asset',
  })
  @ApiParam({
    name: 'asset',
    description: 'The Asset (Ticker/Asset ID)',
    type: 'string',
    example: 'TICKER',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Offering',
    type: 'string',
    example: '1',
  })
  @ApiQuery({
    name: 'size',
    description: 'The number of Investments to be fetched',
    type: 'string',
    required: false,
    example: '10',
  })
  @ApiQuery({
    name: 'start',
    description: 'Starting offset for pagination',
    type: 'string',
    required: false,
    example: '0',
  })
  @ApiArrayResponse(InvestmentModel, {
    description: 'A List of Investments',
    paginated: true,
  })
  @Get(':id/investments')
  public async getInvestments(
    @Param() { asset, id }: OfferingParams,
    @Query() { size, start }: PaginatedParamsDto
  ): Promise<PaginatedResultsModel<InvestmentModel>> {
    const {
      data,
      count: total,
      next,
    } = await this.offeringsService.findInvestmentsByAsset(
      asset,
      id,
      size,
      new BigNumber(start || 0)
    );
    return new PaginatedResultsModel({
      results: data.map(({ investor, soldAmount, investedAmount }) => {
        return new InvestmentModel({
          investor,
          soldAmount,
          investedAmount,
        });
      }),
      total,
      next,
    });
  }
}
