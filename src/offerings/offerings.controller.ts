import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  StoBalanceStatus,
  StoSaleStatus,
  StoTimingStatus,
} from '@polymathnetwork/polymesh-sdk/types';

import { TickerParamsDto } from '~/assets/dto/ticker-params.dto';
import { ApiArrayResponse } from '~/common/decorators/swagger';
import { ResultsModel } from '~/common/models/results.model';
import { OfferingStatusFilterDto } from '~/offerings/dto/offering-status-filter.dto';
import { OfferingDetailsModel } from '~/offerings/models/offering-details.model';
import { OfferingsService } from '~/offerings/offerings.service';
import { createOfferingDetailsModel } from '~/offerings/offerings.util';

@ApiTags('offerings')
@Controller('assets/:ticker/offerings')
export class OfferingsController {
  constructor(private readonly offeringsService: OfferingsService) {}

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
}
