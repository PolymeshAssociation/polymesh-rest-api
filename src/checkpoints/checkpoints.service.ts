import { Injectable, NotFoundException } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  Checkpoint,
  CheckpointSchedule,
  CheckpointWithData,
  ErrorCode,
  IdentityBalance,
  ResultSet,
  ScheduleWithDetails,
} from '@polymeshassociation/polymesh-sdk/types';
import { isPolymeshError } from '@polymeshassociation/polymesh-sdk/utils';

import { AssetsService } from '~/assets/assets.service';
import { IdentityBalanceModel } from '~/assets/models/identity-balance.model';
import { CreateCheckpointScheduleDto } from '~/checkpoints/dto/create-checkpoint-schedule.dto';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { extractTxBase, ServiceReturn } from '~/common/utils';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { TransactionsService } from '~/transactions/transactions.service';

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
    const asset = await this.assetsService.findOne(ticker);
    return asset.checkpoints.get({ start, size });
  }

  public async findOne(ticker: string, id: BigNumber): Promise<Checkpoint> {
    const asset = await this.assetsService.findOne(ticker);
    try {
      return await asset.checkpoints.getOne({ id });
    } catch (err) {
      if (isPolymeshError(err)) {
        const { code } = err;
        if (code === ErrorCode.DataUnavailable) {
          this.logger.warn(`No Checkpoint exists for ticker "${ticker}" with ID "${id}"`);
          throw new NotFoundException(
            `There is no Checkpoint for ticker "${ticker}" with ID "${id}"`
          );
        }
      }
      throw err;
    }
  }

  public async findSchedulesByTicker(ticker: string): Promise<ScheduleWithDetails[]> {
    const asset = await this.assetsService.findOne(ticker);
    return asset.checkpoints.schedules.get();
  }

  public async findScheduleById(ticker: string, id: BigNumber): Promise<ScheduleWithDetails> {
    const asset = await this.assetsService.findOne(ticker);
    try {
      return await asset.checkpoints.schedules.getOne({ id });
    } catch (err: unknown) {
      if (isPolymeshError(err)) {
        const { code } = err;
        if (code === ErrorCode.DataUnavailable) {
          this.logger.warn(`No Schedule exists for ticker "${ticker}" with ID "${id}"`);
          throw new NotFoundException(
            `There is no Schedule for ticker "${ticker}" with ID "${id}"`
          );
        }
      }
      throw err;
    }
  }

  public async createByTicker(
    ticker: string,
    signerDto: TransactionBaseDto
  ): ServiceReturn<Checkpoint> {
    const asset = await this.assetsService.findOne(ticker);

    return this.transactionsService.submit(asset.checkpoints.create, {}, signerDto);
  }

  public async createScheduleByTicker(
    ticker: string,
    createCheckpointScheduleDto: CreateCheckpointScheduleDto
  ): ServiceReturn<CheckpointSchedule> {
    const { base, args } = extractTxBase(createCheckpointScheduleDto);

    const asset = await this.assetsService.findOne(ticker);

    return this.transactionsService.submit(asset.checkpoints.schedules.create, args, base);
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
    const asset = await this.assetsService.findOne(ticker);
    return this.transactionsService.submit(
      asset.checkpoints.schedules.remove,
      { schedule: id },
      transactionBaseDto
    );
  }
}
