import { Injectable } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  Checkpoint,
  CheckpointSchedule,
  CheckpointWithData,
  IdentityBalance,
  ResultSet,
  ScheduleWithDetails,
} from '@polymeshassociation/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { IdentityBalanceModel } from '~/assets/models/identity-balance.model';
import { CreateCheckpointScheduleDto } from '~/checkpoints/dto/create-checkpoint-schedule.dto';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { extractTxOptions, ServiceReturn } from '~/common/utils';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { TransactionsService } from '~/transactions/transactions.service';
import { handleSdkError } from '~/transactions/transactions.util';

@Injectable()
export class CheckpointsService {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly transactionsService: TransactionsService,
    private readonly logger: PolymeshLogger
  ) {
    logger.setContext(CheckpointsService.name);
  }

  public async findAllByAsset(
    asset: string,
    size: BigNumber,
    start?: string
  ): Promise<ResultSet<CheckpointWithData>> {
    const fungibleAsset = await this.assetsService.findFungible(asset);

    return fungibleAsset.checkpoints.get({ start, size });
  }

  public async findOne(asset: string, id: BigNumber): Promise<Checkpoint> {
    const fungibleAsset = await this.assetsService.findFungible(asset);

    return await fungibleAsset.checkpoints.getOne({ id }).catch(error => {
      throw handleSdkError(error);
    });
  }

  public async findSchedulesByAsset(asset: string): Promise<ScheduleWithDetails[]> {
    const fungibleAsset = await this.assetsService.findFungible(asset);

    return fungibleAsset.checkpoints.schedules.get();
  }

  public async findScheduleById(asset: string, id: BigNumber): Promise<ScheduleWithDetails> {
    const fungibleAsset = await this.assetsService.findFungible(asset);

    return await fungibleAsset.checkpoints.schedules.getOne({ id }).catch(error => {
      throw handleSdkError(error);
    });
  }

  public async createByAsset(
    asset: string,
    signerDto: TransactionBaseDto
  ): ServiceReturn<Checkpoint> {
    const { options } = extractTxOptions(signerDto);
    const fungibleAsset = await this.assetsService.findFungible(asset);

    return this.transactionsService.submit(fungibleAsset.checkpoints.create, {}, options);
  }

  public async createScheduleByAsset(
    asset: string,
    createCheckpointScheduleDto: CreateCheckpointScheduleDto
  ): ServiceReturn<CheckpointSchedule> {
    const { options, args } = extractTxOptions(createCheckpointScheduleDto);
    const fungibleAsset = await this.assetsService.findFungible(asset);

    return this.transactionsService.submit(
      fungibleAsset.checkpoints.schedules.create,
      args,
      options
    );
  }

  public async getAssetBalance(
    asset: string,
    did: string,
    checkpointId: BigNumber
  ): Promise<IdentityBalanceModel> {
    const checkpoint = await this.findOne(asset, checkpointId);
    const balance = await checkpoint.balance({ identity: did });

    return new IdentityBalanceModel({ identity: did, balance });
  }

  public async getHolders(
    asset: string,
    checkpointId: BigNumber,
    size: BigNumber,
    start?: string
  ): Promise<ResultSet<IdentityBalance>> {
    const checkpoint = await this.findOne(asset, checkpointId);

    return checkpoint.allBalances({ start, size });
  }

  public async deleteScheduleByAsset(
    asset: string,
    id: BigNumber,
    transactionBaseDto: TransactionBaseDto
  ): ServiceReturn<void> {
    const { options } = extractTxOptions(transactionBaseDto);
    const fungibleAsset = await this.assetsService.findFungible(asset);

    return this.transactionsService.submit(
      fungibleAsset.checkpoints.schedules.remove,
      { schedule: id },
      options
    );
  }

  public async findCheckpointsByScheduleId(
    asset: string,
    id: BigNumber
  ): Promise<CheckpointWithData[]> {
    const schedule = await this.findScheduleById(asset, id);

    const checkpoints = await schedule.schedule.getCheckpoints();

    const checkpointDetailsPromises = checkpoints.map(async (checkpoint: Checkpoint) => {
      const [createdAt, totalSupply] = await Promise.all([
        checkpoint.createdAt(),
        checkpoint.totalSupply(),
      ]);

      return {
        checkpoint,
        createdAt,
        totalSupply,
      };
    });

    return Promise.all(checkpointDetailsPromises);
  }

  public async getComplexityForAsset(
    asset: string
  ): Promise<{ schedules: ScheduleWithDetails[]; maxComplexity: BigNumber }> {
    const fungibleAsset = await this.assetsService.findFungible(asset);
    const [schedules, maxComplexity] = await Promise.all([
      fungibleAsset.checkpoints.schedules.get(),
      fungibleAsset.checkpoints.schedules.maxComplexity(),
    ]);

    return { schedules, maxComplexity };
  }

  public async getComplexityForPeriod(
    asset: string,
    id: BigNumber,
    start?: Date,
    end?: Date
  ): Promise<BigNumber> {
    const { schedule } = await this.findScheduleById(asset, id);

    const checkpoints = await schedule.getCheckpoints();
    const pendingPoints = schedule.pendingPoints;
    const checkpointDatePromises = checkpoints.map(checkpoint => checkpoint.createdAt());

    const pastCheckpoints = await Promise.all(checkpointDatePromises);

    const allCheckpoints = [...pendingPoints, ...pastCheckpoints];

    const checkpointsInPeriod = allCheckpoints.filter(
      date => (!start || date >= start) && (!end || date <= end)
    );

    return new BigNumber(checkpointsInPeriod.length);
  }
}
