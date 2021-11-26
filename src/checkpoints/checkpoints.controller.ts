import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { TickerParamsDto } from '~/assets/dto/ticker-params.dto';
import { IdentityBalanceModel } from '~/assets/models/identity-balance.model';
import { CheckpointsService } from '~/checkpoints/checkpoints.service';
import { CheckPointBalanceParamsDto } from '~/checkpoints/dto/checkpoint-balance.dto';
import { CreateCheckpointScheduleDto } from '~/checkpoints/dto/create-checkpoint-schedule.dto';
import { GetCheckPointParamsDto } from '~/checkpoints/dto/get-checkpoint.dto';
import { CheckpointDetailsModel } from '~/checkpoints/models/checkpoint-details.model';
import { CheckpointScheduleModel } from '~/checkpoints/models/checkpoint-schedule.model';
import { CreatedCheckpointScheduleModel } from '~/checkpoints/models/created-checkpoint-schedule.model';
import { CreatedCheckpointModel } from '~/checkpoints/models/created-checkpoint.model';
import { ApiArrayResponse } from '~/common/decorators/swagger';
import { IsTicker } from '~/common/decorators/validation';
import { IdParamsDto } from '~/common/dto/id-params.dto';
import { PaginatedParamsDto } from '~/common/dto/paginated-params.dto';
import { SignerDto } from '~/common/dto/signer.dto';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { ResultsModel } from '~/common/models/results.model';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';

export class DeleteCheckpointScheduleParams extends IdParamsDto {
  @IsTicker()
  readonly ticker: string;
}

@ApiTags('checkpoints')
@ApiTags('assets')
@Controller('assets/:ticker/checkpoints')
export class CheckpointsController {
  constructor(private readonly checkpointsService: CheckpointsService) {}

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

  @ApiOperation({
    summary: 'Fetch details of an Asset Checkpoint',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset whose Checkpoint is to be fetched',
    type: 'string',
    example: 'TICKER',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Checkpoint to be fetched',
    type: 'string',
    example: '1',
  })
  @ApiNotFoundResponse({
    description: 'Either the Asset or the Checkpoint was not found',
  })
  @ApiOkResponse({
    description: 'The Checkpoint details',
    type: CheckpointDetailsModel,
  })
  @Get('/:id')
  public async getCheckpoint(
    @Param() { ticker, id }: GetCheckPointParamsDto
  ): Promise<CheckpointDetailsModel> {
    const checkpoint = await this.checkpointsService.findOne(ticker, id);
    const createdAt = await checkpoint.createdAt();
    const totalSupply = await checkpoint.totalSupply();
    return new CheckpointDetailsModel({ id, createdAt, totalSupply });
  }

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
    type: CreatedCheckpointModel,
  })
  @Post()
  public async createCheckpoint(
    @Param() { ticker }: TickerParamsDto,
    @Body() signerDto: SignerDto
  ): Promise<CreatedCheckpointModel> {
    const { result: checkpoint, transactions } = await this.checkpointsService.createByTicker(
      ticker,
      signerDto
    );
    return new CreatedCheckpointModel({ checkpoint, transactions });
  }

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

  @ApiOperation({
    summary: 'Get Asset balance at a Checkpoint',
    description:
      'This endpoint returns the asset balance an identity has at a paticular checkpoint',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset for which the balance is to be fetched for',
  })
  @ApiParam({
    name: 'id',
    description: 'The Checkpoint ID to fetch the balance from',
    type: 'number',
    example: '2',
  })
  @ApiParam({
    name: 'did',
    description: 'The Identity of who to fetch the balance for',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiOkResponse({
    description: 'The amount of the Asset the Identity held at a given Checkpoint',
    type: IdentityBalanceModel,
  })
  @ApiNotFoundResponse({
    description: 'The Asset or Checkpoint was not found',
  })
  @Get(':id/identities/:did/balance')
  public async getAssetBalance(
    @Param() { ticker, did, id }: CheckPointBalanceParamsDto
  ): Promise<IdentityBalanceModel> {
    return this.checkpointsService.getAssetBalance(ticker, did, id);
  }

  // TODO @prashantasdeveloper: Update error responses post handling error codes
  // TODO @prashantasdeveloper: Move the signer to headers
  @ApiOperation({
    summary: 'Delete Schedule',
    description: 'This endpoint will delete an existing Schedule for Checkpoint creation',
  })
  @ApiParam({
    name: 'ticker',
    description: 'The ticker of the Asset for which the Schedule is to be deleted',
    type: 'string',
    example: 'TICKER',
  })
  @ApiParam({
    name: 'id',
    description: 'Schedule ID to be deleted',
    type: 'string',
    example: '1',
  })
  @ApiOkResponse({
    description: 'Information about the transaction',
    type: TransactionQueueModel,
  })
  @ApiBadRequestResponse({
    description: "Schedule doesn't exist. It may have expired, been removed, or never been created",
  })
  @Delete('schedules/:id')
  public async deleteSchedule(
    @Param() { ticker, id }: DeleteCheckpointScheduleParams,
    @Query() { signer }: SignerDto
  ): Promise<TransactionQueueModel> {
    const { transactions } = await this.checkpointsService.deleteScheduleByTicker(
      ticker,
      id,
      signer
    );
    return new TransactionQueueModel({ transactions });
  }
}
