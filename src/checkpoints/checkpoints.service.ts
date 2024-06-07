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

  public async findAllByTicker(
    ticker: string,
    size: BigNumber,
    start?: string
  ): Promise<ResultSet<CheckpointWithData>> {
    const asset = await this.assetsService.findFungible(ticker);

    return asset.checkpoints.get({ start, size });
  }

  public async findOne(ticker: string, id: BigNumber): Promise<Checkpoint> {
    const asset = await this.assetsService.findFungible(ticker);

    return await asset.checkpoints.getOne({ id }).catch(error => {
      throw handleSdkError(error);
    });
  }

  public async findSchedulesByTicker(ticker: string): Promise<ScheduleWithDetails[]> {
    const asset = await this.assetsService.findFungible(ticker);

    return asset.checkpoints.schedules.get();
  }

  public async findScheduleById(ticker: string, id: BigNumber): Promise<ScheduleWithDetails> {
    const asset = await this.assetsService.findFungible(ticker);

    return await asset.checkpoints.schedules.getOne({ id }).catch(error => {
      throw handleSdkError(error);
    });
  }

  public async createByTicker(
    ticker: string,
    signerDto: TransactionBaseDto
  ): ServiceReturn<Checkpoint> {
    const { options } = extractTxOptions(signerDto);
    const asset = await this.assetsService.findFungible(ticker);

    return this.transactionsService.submit(asset.checkpoints.create, {}, options);
  }

  public async createScheduleByTicker(
    ticker: string,
    createCheckpointScheduleDto: CreateCheckpointScheduleDto
  ): ServiceReturn<CheckpointSchedule> {
    const { options, args } = extractTxOptions(createCheckpointScheduleDto);
    const asset = await this.assetsService.findFungible(ticker);

    return this.transactionsService.submit(asset.checkpoints.schedules.create, args, options);
  }

  public async getAssetBalance(
    ticker: string,
    did: string,
    checkpointId: BigNumber
  ): Promise<IdentityBalanceModel> {
    const checkpoint = await this.findOne(ticker, checkpointId);
    const balance = await checkpoint.balance({ identity: did });

    return new IdentityBalanceModel({ identity: did, balance });
  }

  public async getHolders(
    ticker: string,
    checkpointId: BigNumber,
    size: BigNumber,
    start?: string
  ): Promise<ResultSet<IdentityBalance>> {
    const checkpoint = await this.findOne(ticker, checkpointId);

    return checkpoint.allBalances({ start, size });
  }

  public async deleteScheduleByTicker(
    ticker: string,
    id: BigNumber,
    transactionBaseDto: TransactionBaseDto
  ): ServiceReturn<void> {
    const { options } = extractTxOptions(transactionBaseDto);
    const asset = await this.assetsService.findFungible(ticker);

    return this.transactionsService.submit(
      asset.checkpoints.schedules.remove,
      { schedule: id },
      options
    );
  }

  public async findCheckpointsByScheduleId(
    ticker: string,
    id: BigNumber
  ): Promise<CheckpointWithData[]> {
    const schedule = await this.findScheduleById(ticker, id);

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
    ticker: string
  ): Promise<{ schedules: ScheduleWithDetails[]; maxComplexity: BigNumber }> {
    const asset = await this.assetsService.findFungible(ticker);
    const [schedules, maxComplexity] = await Promise.all([
      asset.checkpoints.schedules.get(),
      asset.checkpoints.schedules.maxComplexity(),
    ]);

    return { schedules, maxComplexity };
  }

  public async getComplexityForPeriod(
    ticker: string,
    id: BigNumber,
    start?: Date,
    end?: Date
  ): Promise<BigNumber> {
    const { schedule } = await this.findScheduleById(ticker, id);

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
