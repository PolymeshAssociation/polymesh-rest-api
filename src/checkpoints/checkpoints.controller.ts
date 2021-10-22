import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { ScheduleWithDetails } from '@polymathnetwork/polymesh-sdk/types';

import { TickerParamsDto } from '~/assets/dto/ticker-params.dto';
import { CheckpointsService } from '~/checkpoints/checkpoints.service';
import { CheckpointScheduleModel } from '~/checkpoints/models/checkpoint-schedule.model';
import { CheckpointDetailsModel } from '~/checkpoints/models/checkpoints.model';
import { ApiArrayResponse } from '~/common/decorators/swagger';
import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber, IsTicker } from '~/common/decorators/validation';
import { IdParamsDto } from '~/common/dto/id-params.dto';
import { PaginatedParamsDto } from '~/common/dto/paginated-params.dto';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { ResultsModel } from '~/common/models/results.model';

class CheckpointScheduleParamsDto extends IdParamsDto {
  @ApiProperty({
    description: 'ID of the Schedule',
    type: 'string',
    example: '123',
  })
  @IsBigNumber()
  @ToBigNumber()
  readonly id: BigNumber;

  @ApiProperty({
    description: 'The ticker to reserve',
    example: 'BRK.A',
  })
  @IsTicker()
  readonly ticker: string;
}

@ApiTags('checkpoints')
@Controller('assets/:ticker/checkpoints')
export class CheckpointsController {
  constructor(private readonly checkpointsService: CheckpointsService) {}

  @ApiTags('assets')
  @ApiOperation({
    summary: 'Fetch Asset Checkpoints',
    description: 'This endpoint will provide the list of Checkpoints created on this Asset',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset whose attached Checkpoints are to be fetched',
    type: 'string',
    example: 'TICKER',
  })
  @ApiQuery({
    name: 'size',
    description: 'The number of Checkpoints to be fetched',
    type: 'number',
    required: false,
    example: 10,
  })
  @ApiQuery({
    name: 'start',
    description: 'Start key from which Checkpoints are to be fetched',
    type: 'string',
    required: false,
    example: 'START_KEY',
  })
  @ApiArrayResponse(CheckpointDetailsModel, {
    description: 'List of Checkpoints created on this Asset',
    paginated: true,
  })
  @Get()
  public async getCheckpoints(
    @Param() { ticker }: TickerParamsDto,
    @Query() { size, start }: PaginatedParamsDto
  ): Promise<PaginatedResultsModel<CheckpointDetailsModel>> {
    const { data, count: total, next } = await this.checkpointsService.findAllByTicker(
      ticker,
      size,
      start?.toString()
    );

    return new PaginatedResultsModel({
      results: data.map(
        ({ checkpoint: { id }, createdAt, totalSupply }) =>
          new CheckpointDetailsModel({
            id,
            createdAt,
            totalSupply,
          })
      ),
      total,
      next,
    });
  }

  @ApiTags('assets')
  @ApiOperation({
    summary: 'Fetch all active Checkpoint Schedules',
    description:
      'This endpoint will provide the list of active Schedules which create Checkpoints for a specific Asset',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset whose attached Checkpoint Schedules are to be fetched',
    type: 'string',
    example: 'TICKER',
  })
  @ApiArrayResponse(CheckpointScheduleModel, {
    description: 'List of active Schedules which create Checkpoints for a specific Asset',
    paginated: false,
  })
  @Get('schedules')
  public async getSchedules(
    @Param() { ticker }: TickerParamsDto
  ): Promise<ResultsModel<CheckpointScheduleModel>> {
    const schedules = await this.checkpointsService.findSchedulesByTicker(ticker);
    return new ResultsModel({
      results: schedules.map(
        ({ schedule: { id, period, start, complexity, expiryDate }, details }) =>
          new CheckpointScheduleModel({
            id,
            period,
            start,
            complexity,
            expiryDate,
            ...details,
          })
      ),
    });
  }

  @Get('schedule/:id')
  public async getSchedule(
    @Param() { ticker, id }: CheckpointScheduleParamsDto
  ): Promise<CheckpointScheduleModel> {
    const {
      schedule: { id: scheduleId, period, start, complexity, expiryDate },
      details,
    }: ScheduleWithDetails = await this.checkpointsService.findScheduleByTicker(ticker, id);
    return new CheckpointScheduleModel({
      id: scheduleId,
      period,
      start,
      complexity,
      expiryDate,
      ...details,
    });
  }
}
