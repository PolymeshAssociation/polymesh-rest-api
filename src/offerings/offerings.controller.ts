import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  StoBalanceStatus,
  StoSaleStatus,
  StoTimingStatus,
} from '@polymathnetwork/polymesh-sdk/types';

import { TickerParamsDto } from '~/assets/dto/ticker-params.dto';
import { ApiArrayResponse } from '~/common/decorators/swagger';
import { IsTicker } from '~/common/decorators/validation';
import { IdParamsDto } from '~/common/dto/id-params.dto';
import { PaginatedParamsDto } from '~/common/dto/paginated-params.dto';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { ResultsModel } from '~/common/models/results.model';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { OfferingStatusFilterDto } from '~/offerings/dto/offering-status-filter.dto';
import { InvestmentModel } from '~/offerings/models/investment.model';
import { OfferingDetailsModel } from '~/offerings/models/offering-details.model';
import { OfferingsService } from '~/offerings/offerings.service';
import { createOfferingDetailsModel } from '~/offerings/offerings.util';

class OfferingParams extends IdParamsDto {
  @IsTicker()
  readonly ticker: string;
}

@ApiTags('offerings')
@Controller('assets/:ticker/offerings')
export class OfferingsController {
  constructor(
    private readonly offeringsService: OfferingsService,
    private readonly logger: PolymeshLogger
  ) {
    this.logger.setContext(OfferingsController.name);
  }

  @ApiTags('assets')
  @ApiOperation({
    summary: 'Fetch Token Offerings for an Asset',
    description: 'This endpoint will provide the list of all Token Offerings for an Asset',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset whose Offerings are to be fetched',
    type: 'string',
    example: 'TICKER',
  })
  @ApiQuery({
    name: 'timing',
    description: 'Timing status by which to filter Offerings',
    enum: StoTimingStatus,
    required: false,
  })
  @ApiQuery({
    name: 'balance',
    description: 'Balance status by which to filter Offerings',
    enum: StoBalanceStatus,
    required: false,
  })
  @ApiQuery({
    name: 'sale',
    description: 'Sale status by which to filter Offerings',
    enum: StoSaleStatus,
    required: false,
  })
  @ApiArrayResponse(OfferingDetailsModel, {
    description: 'List of Token Offerings for this Asset',
    paginated: false,
  })
  @Get()
  public async getOfferings(
    @Param() { ticker }: TickerParamsDto,
    @Query() { timing, balance, sale }: OfferingStatusFilterDto
  ): Promise<ResultsModel<OfferingDetailsModel>> {
    const offerings = await this.offeringsService.findAllByTicker(ticker, {
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
    description: 'This endpoint will return a list of Investments made in an Offering',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset',
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
    description: 'The number of results to return',
    type: 'number',
    required: false,
  })
  @ApiQuery({
    name: 'start',
    description: 'Starting offset for pagination.',
    type: 'number',
    required: false,
  })
  @ApiOkResponse({
    description: 'A paginated list of Investments',
    type: InvestmentModel,
  })
  @Get(':id/investments')
  public async getInvestments(
    @Param() { ticker, id }: OfferingParams,
    @Query() { size, start }: PaginatedParamsDto
  ): Promise<PaginatedResultsModel<InvestmentModel>> {
    this.logger.debug(
      `Fetching investments. Ticker: "${ticker}", Offering ID: "${id}", size: "${size}", start: "${start}"`
    );
    const {
      data,
      count: total,
      next,
    } = await this.offeringsService.findInvestments(
      ticker,
      id,
      size,
      start ? parseInt(start.toString()) : 0
    );
    return new PaginatedResultsModel({
      results: data?.map(({ investor, soldAmount, investedAmount }) => {
        return new InvestmentModel({
          investor,
          soldAmount: soldAmount,
          investedAmount: investedAmount,
        });
      }),
      total,
      next,
    });
  }
}
