import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Checkpoint, CheckpointSchedule } from '@polymeshassociation/polymesh-sdk/types';

import { AssetParamsDto } from '~/assets/dto/asset-params.dto';
import { IdentityBalanceModel } from '~/assets/models/identity-balance.model';
import { CheckpointsService } from '~/checkpoints/checkpoints.service';
import { CheckpointParamsDto } from '~/checkpoints/dto/checkpoint.dto';
import { CheckPointBalanceParamsDto } from '~/checkpoints/dto/checkpoint-balance.dto';
import { CreateCheckpointScheduleDto } from '~/checkpoints/dto/create-checkpoint-schedule.dto';
import { PeriodQueryDto } from '~/checkpoints/dto/period-query.dto';
import { CheckpointDetailsModel } from '~/checkpoints/models/checkpoint-details.model';
import { CheckpointScheduleModel } from '~/checkpoints/models/checkpoint-schedule.model';
import { CreatedCheckpointModel } from '~/checkpoints/models/created-checkpoint.model';
import { CreatedCheckpointScheduleModel } from '~/checkpoints/models/created-checkpoint-schedule.model';
import { PeriodComplexityModel } from '~/checkpoints/models/period-complexity.model';
import { ScheduleComplexityModel } from '~/checkpoints/models/schedule-complexity.model';
import { ApiArrayResponse, ApiTransactionResponse } from '~/common/decorators/';
import { IsAsset } from '~/common/decorators/validation';
import { IdParamsDto } from '~/common/dto/id-params.dto';
import { PaginatedParamsDto } from '~/common/dto/paginated-params.dto';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { PaginatedResultsModel } from '~/common/models/paginated-results.model';
import { ResultsModel } from '~/common/models/results.model';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { handleServiceResult, TransactionResolver, TransactionResponseModel } from '~/common/utils';

class DeleteCheckpointScheduleParamsDto extends IdParamsDto {
  @IsAsset()
  readonly asset: string;
}

class CheckpointScheduleParamsDto extends IdParamsDto {
  @IsAsset()
  readonly asset: string;
}

@ApiTags('assets', 'checkpoints')
@Controller('assets/:asset/checkpoints')
export class CheckpointsController {
  constructor(private readonly checkpointsService: CheckpointsService) {}

  @ApiOperation({
    summary: 'Fetch Asset Checkpoints',
    description: 'This endpoint will provide the list of Checkpoints created on this Asset',
  })
  @ApiParam({
    name: 'asset',
    description: 'The Asset (Ticker/Asset ID) whose attached Checkpoints are to be fetched',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @ApiQuery({
    name: 'size',
    description: 'The number of Checkpoints to be fetched',
    type: 'string',
    required: false,
    example: '10',
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
    @Param() { asset }: AssetParamsDto,
    @Query() { size, start }: PaginatedParamsDto
  ): Promise<PaginatedResultsModel<CheckpointDetailsModel>> {
    const {
      data,
      count: total,
      next,
    } = await this.checkpointsService.findAllByAsset(asset, size, start?.toString());

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
    name: 'asset',
    description: 'The Asset (Ticker/Asset ID) whose Checkpoint is to be fetched',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
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
    @Param() { asset, id }: CheckpointParamsDto
  ): Promise<CheckpointDetailsModel> {
    const checkpoint = await this.checkpointsService.findOne(asset, id);
    const [createdAt, totalSupply] = await Promise.all([
      checkpoint.createdAt(),
      checkpoint.totalSupply(),
    ]);
    return new CheckpointDetailsModel({ id, createdAt, totalSupply });
  }

  @ApiOperation({
    summary: 'Create Checkpoint',
    description:
      'This endpoint will create a snapshot of Asset holders and their respective balances at that moment',
  })
  @ApiParam({
    name: 'asset',
    description: 'The Asset (Ticker/Asset ID) for which the Checkpoint is to be created',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @ApiTransactionResponse({
    description: 'Details of the newly created Checkpoint',
    type: CreatedCheckpointModel,
  })
  @Post()
  public async createCheckpoint(
    @Param() { asset }: AssetParamsDto,
    @Body() signerDto: TransactionBaseDto
  ): Promise<TransactionResponseModel> {
    const serviceResult = await this.checkpointsService.createByAsset(asset, signerDto);

    const resolver: TransactionResolver<Checkpoint> = ({
      result: checkpoint,
      transactions,
      details,
    }) =>
      new CreatedCheckpointModel({
        checkpoint,
        transactions,
        details,
      });

    return handleServiceResult(serviceResult, resolver);
  }

  @ApiOperation({
    summary: 'Fetch all active Checkpoint Schedules',
    description:
      'This endpoint will provide the list of active Schedules which create Checkpoints for a specific Asset',
  })
  @ApiParam({
    name: 'asset',
    description:
      'The Asset (Ticker/Asset ID) whose attached Checkpoint Schedules are to be fetched',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @ApiArrayResponse(CheckpointScheduleModel, {
    description: 'List of active Schedules which create Checkpoints for a specific Asset',
    paginated: false,
  })
  @Get('schedules')
  public async getSchedules(
    @Param() { asset }: AssetParamsDto
  ): Promise<ResultsModel<CheckpointScheduleModel>> {
    const schedules = await this.checkpointsService.findSchedulesByAsset(asset);
    return new ResultsModel({
      results: schedules.map(
        ({ schedule: { id, pendingPoints, expiryDate }, details }) =>
          new CheckpointScheduleModel({
            id,
            asset,
            pendingPoints,
            expiryDate,
            ...details,
          })
      ),
    });
  }

  @ApiOperation({
    summary: 'Fetch details of an Asset Checkpoint Schedule',
  })
  @ApiParam({
    name: 'asset',
    description: 'The Asset (Ticker/Asset ID) whose Checkpoint Schedule is to be fetched',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Checkpoint Schedule to be fetched',
    type: 'string',
    example: '1',
  })
  @ApiOkResponse({
    description: 'The Checkpoint Schedule details',
    type: CheckpointScheduleModel,
  })
  @ApiNotFoundResponse({
    description: 'Either the Asset or the Checkpoint Schedule does not exist',
  })
  @Get('schedules/:id')
  public async getSchedule(
    @Param() { asset, id }: CheckpointScheduleParamsDto
  ): Promise<CheckpointScheduleModel> {
    const {
      schedule: { pendingPoints, expiryDate },
      details,
    } = await this.checkpointsService.findScheduleById(asset, id);

    return new CheckpointScheduleModel({
      id,
      asset,
      pendingPoints,
      expiryDate,
      ...details,
    });
  }

  @ApiOperation({
    summary: 'Create Schedule',
    description: 'This endpoint will create a Schedule that creates Checkpoints periodically',
  })
  @ApiParam({
    name: 'asset',
    description: 'The Asset (Ticker/Asset ID) for which the Checkpoint creation is to be scheduled',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @ApiTransactionResponse({
    description: 'Details of the newly created Checkpoint Schedule',
    type: CreatedCheckpointScheduleModel,
  })
  @Post('schedules/create')
  public async createSchedule(
    @Param() { asset }: AssetParamsDto,
    @Body() createCheckpointScheduleDto: CreateCheckpointScheduleDto
  ): Promise<TransactionResponseModel> {
    const serviceResult = await this.checkpointsService.createScheduleByAsset(
      asset,
      createCheckpointScheduleDto
    );

    const resolver: TransactionResolver<CheckpointSchedule> = async ({
      result,
      transactions,
      details,
    }) => {
      const { id: createdScheduleId } = result;
      const {
        schedule: { id, pendingPoints, expiryDate },
        details: scheduleDetails,
      } = await this.checkpointsService.findScheduleById(asset, createdScheduleId);

      return new CreatedCheckpointScheduleModel({
        schedule: new CheckpointScheduleModel({
          id,
          asset,
          pendingPoints,
          expiryDate,
          ...scheduleDetails,
        }),
        transactions,
        details,
      });
    };

    return handleServiceResult(serviceResult, resolver);
  }

  @ApiOperation({
    summary: 'Get the Asset balance of the holders at a given Checkpoint',
    description: 'This endpoint returns the Asset balance of holders at a given Checkpoint',
  })
  @ApiParam({
    name: 'asset',
    description: 'The Asset (Ticker/Asset ID) for which to fetch holder balances',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Checkpoint for which to fetch Asset balances',
    type: 'string',
    example: '1',
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
    example: 'START_KEY',
  })
  @ApiNotFoundResponse({
    description: 'Either the Asset or the Checkpoint was not found',
  })
  @ApiArrayResponse(IdentityBalanceModel, {
    description: 'List of balances of the Asset holders at the Checkpoint',
    paginated: true,
  })
  @Get(':id/balances')
  public async getHolders(
    @Param() { asset, id }: CheckpointParamsDto,
    @Query() { size, start }: PaginatedParamsDto
  ): Promise<PaginatedResultsModel<IdentityBalanceModel>> {
    const {
      data,
      count: total,
      next,
    } = await this.checkpointsService.getHolders(asset, id, size, start?.toString());
    return new PaginatedResultsModel({
      results: data.map(
        ({ identity, balance }) => new IdentityBalanceModel({ identity: identity.did, balance })
      ),
      total,
      next,
    });
  }

  @ApiOperation({
    summary: 'Get the Asset balance for an Identity at a Checkpoint',
    description:
      'This endpoint returns the Asset balance an Identity has at a particular Checkpoint',
  })
  @ApiParam({
    name: 'asset',
    description: 'The Asset (Ticker/Asset ID) for which the balance is to be fetched',
  })
  @ApiParam({
    name: 'id',
    description: 'The Checkpoint ID to from which to fetch the balance',
    type: 'string',
    example: '2',
  })
  @ApiParam({
    name: 'did',
    description: 'The Identity for which to fetch the Asset balance',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ApiOkResponse({
    description: 'The balance of the Asset the Identity held at a given Checkpoint',
    type: IdentityBalanceModel,
  })
  @ApiNotFoundResponse({
    description: 'The Asset or Checkpoint was not found',
  })
  @Get(':id/balances/:did')
  public async getAssetBalance(
    @Param() { asset, did, id }: CheckPointBalanceParamsDto
  ): Promise<IdentityBalanceModel> {
    return this.checkpointsService.getAssetBalance(asset, did, id);
  }

  // TODO @prashantasdeveloper: Move the signer to headers
  @ApiOperation({
    summary: 'Delete Schedule',
    description: 'This endpoint will delete an existing Schedule for Checkpoint creation',
  })
  @ApiParam({
    name: 'asset',
    description: 'The Asset (Ticker/Asset ID) for which the Schedule is to be deleted',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
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
  @ApiNotFoundResponse({
    description: "Schedule doesn't exist. It may have expired, been removed, or never been created",
  })
  @Post('schedules/:id/delete')
  public async deleteSchedule(
    @Param() { asset, id }: DeleteCheckpointScheduleParamsDto,
    @Query() transactionBaseDto: TransactionBaseDto
  ): Promise<TransactionResponseModel> {
    const result = await this.checkpointsService.deleteScheduleByAsset(
      asset,
      id,
      transactionBaseDto
    );
    return handleServiceResult(result);
  }

  @ApiOperation({
    summary: 'Get all Checkpoints originated from a given Schedule',
    description: 'This endpoint returns all Checkpoints that were created from a specific Schedule',
  })
  @ApiParam({
    name: 'asset',
    description: 'The Asset (Ticker/Asset ID) whose Checkpoints are to be fetched',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @ApiParam({
    name: 'scheduleId',
    description: 'The ID of the Schedule whose Checkpoints are to be fetched',
    type: 'string',
    example: '1',
  })
  @ApiArrayResponse(CheckpointDetailsModel, {
    description: 'List of Checkpoints originated from the given Schedule',
    paginated: false,
  })
  @ApiNotFoundResponse({
    description: 'The Asset or Schedule was not found',
  })
  @Get('schedules/:id/checkpoints')
  public async getCheckpointsBySchedule(
    @Param() { asset, id: checkpointId }: CheckpointParamsDto
  ): Promise<CheckpointDetailsModel[]> {
    const checkpointsWithDetails = await this.checkpointsService.findCheckpointsByScheduleId(
      asset,
      checkpointId
    );

    return checkpointsWithDetails.map(
      ({ checkpoint: { id }, createdAt, totalSupply }) =>
        new CheckpointDetailsModel({ id, createdAt, totalSupply })
    );
  }

  @ApiOperation({
    summary: 'Fetch Asset Schedules complexity',
  })
  @ApiParam({
    name: 'asset',
    description: 'The Asset (Ticker/Asset ID) for which Schedule complexity is to be fetched',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @ApiNotFoundResponse({
    description: 'The Asset was not found',
  })
  @ApiOkResponse({
    description: 'Complexity details for the Schedules of the Asset',
    type: ScheduleComplexityModel,
    isArray: true,
  })
  @Get('/complexity')
  public async getComplexity(
    @Param() { asset }: AssetParamsDto
  ): Promise<ScheduleComplexityModel[]> {
    const { schedules, maxComplexity } = await this.checkpointsService.getComplexityForAsset(asset);

    return schedules.map(({ schedule }) => {
      return new ScheduleComplexityModel({
        id: schedule.id,
        maxComplexity,
        currentComplexity: new BigNumber(schedule.pendingPoints.length),
      });
    });
  }

  @ApiOperation({
    summary: 'Fetch details of an Asset Checkpoint Schedule',
  })
  @ApiParam({
    name: 'asset',
    description: 'The Asset (Ticker/Asset ID) whose Checkpoint Schedule is to be fetched',
    type: 'string',
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the Checkpoint Schedule to be fetched',
    type: 'string',
    example: '1',
  })
  @ApiQuery({
    name: 'start',
    description: 'Start date for the period for which to fetch complexity',
    type: 'string',
    required: false,
    example: '2021-01-01',
  })
  @ApiQuery({
    name: 'end',
    description: 'End date for the period for which to fetch complexity',
    type: 'string',
    required: false,
    example: '2021-01-31',
  })
  @ApiOkResponse({
    description: 'The complexity of the Schedule for the given period',
    type: ScheduleComplexityModel,
  })
  @ApiNotFoundResponse({
    description: 'Either the Asset or the Checkpoint Schedule does not exist',
  })
  @Get('schedules/:id/complexity')
  public async getPeriodComplexity(
    @Param() { asset, id }: CheckpointScheduleParamsDto,
    @Query() { start, end }: PeriodQueryDto
  ): Promise<PeriodComplexityModel> {
    const complexity = await this.checkpointsService.getComplexityForPeriod(asset, id, start, end);

    return new PeriodComplexityModel({
      complexity,
    });
  }
}
