import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { TickerParamsDto } from '~/assets/dto/ticker-params.dto';
import { CheckpointsService } from '~/checkpoints/checkpoints.service';
import { CreateCheckpointScheduleDto } from '~/checkpoints/dto/create-checkpoint-schedule.dto';
import { CheckpointDetailsModel } from '~/checkpoints/models/checkpoint-details.model';
import { CheckpointScheduleModel } from '~/checkpoints/models/checkpoint-schedule.model';
import { CheckpointModel } from '~/checkpoints/models/checkpoint.model';
import { CreatedCheckpointScheduleModel } from '~/checkpoints/models/created-checkpoint-schedule.model';
import { ApiArrayResponse } from '~/common/decorators/swagger';
import { PaginatedParamsDto } from '~/common/dto/paginated-params.dto';
import { SignerDto } from '~/common/dto/signer.dto';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { ResultsModel } from '~/common/models/results.model';

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
  @ApiBadRequestResponse({
    description: 'Schedule start date must be in the future',
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
    summary: 'Create Checkpoint',
    description:
      'This endpoint will create a snapshot of Asset holders and their respective balances at that moment',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset for which the Checkpoint is to be created',
    type: 'string',
    example: 'TICKER',
  })
  @ApiCreatedResponse({
    description: 'Details of the newly created Checkpoint',
    type: CheckpointModel,
  })
  @Post()
  public async createCheckpoint(
    @Param() { ticker }: TickerParamsDto,
    @Body() signerDto: SignerDto
  ): Promise<CheckpointModel> {
    const { result, transactions } = await this.checkpointsService.createByTicker(
      ticker,
      signerDto
    );
    return new CheckpointModel({ checkpoint: result, transactions });
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
            ticker,
            period,
            start,
            complexity,
            expiryDate,
            ...details,
          })
      ),
    });
  }

  @ApiTags('assets')
  @ApiOperation({
    summary: 'Create Schedule',
    description: 'This endpoint will create a Schedule that creates Checkpoints periodically',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset for which the Checkpoint creation is to be scheduled',
    type: 'string',
    example: 'TICKER',
  })
  @ApiCreatedResponse({
    description: 'Details of the newly created Checkpoint Schedule',
    type: CreatedCheckpointScheduleModel,
  })
  @Post('schedules')
  public async createSchedule(
    @Param() { ticker }: TickerParamsDto,
    @Body() createCheckpointScheduleDto: CreateCheckpointScheduleDto
  ): Promise<CreatedCheckpointScheduleModel> {
    const {
      result: { id: createdScheduleId },
      transactions,
    } = await this.checkpointsService.createScheduleByTicker(ticker, createCheckpointScheduleDto);

    const {
      schedule: { id, period, start, complexity, expiryDate },
      details,
    } = await this.checkpointsService.findScheduleById(ticker, createdScheduleId);

    return new CreatedCheckpointScheduleModel({
      schedule: new CheckpointScheduleModel({
        id,
        ticker,
        period,
        start,
        complexity,
        expiryDate,
        ...details,
      }),
      transactions,
    });
  }
}
