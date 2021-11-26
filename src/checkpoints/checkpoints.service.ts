import { Injectable, NotFoundException } from '@nestjs/common';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { Checkpoint } from '@polymathnetwork/polymesh-sdk/internal';
import {
  CheckpointSchedule,
  CheckpointWithData,
  ErrorCode,
  IdentityBalance,
  ResultSet,
  ScheduleWithDetails,
} from '@polymathnetwork/polymesh-sdk/types';
import { isPolymeshError } from '@polymathnetwork/polymesh-sdk/utils';

import { AssetsService } from '~/assets/assets.service';
import { IdentityBalanceModel } from '~/assets/models/identity-balance.model';
import { CreateCheckpointScheduleDto } from '~/checkpoints/dto/create-checkpoint-schedule.dto';
import { SignerDto } from '~/common/dto/signer.dto';
import { QueueResult } from '~/common/types';
import { processQueue } from '~/common/utils/utils';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { RelayerAccountsService } from '~/relayer-accounts/relayer-accounts.service';

@Injectable()
export class CheckpointsService {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly relayerAccountsService: RelayerAccountsService,
    private readonly logger: PolymeshLogger
  ) {
    this.logger.setContext(CheckpointsService.name);
  }

  public async findAllByTicker(
    ticker: string,
    size: number,
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
    signerDto: SignerDto
  ): Promise<QueueResult<Checkpoint>> {
    const { signer } = signerDto;
    const asset = await this.assetsService.findOne(ticker);
    const address = this.relayerAccountsService.findAddressByDid(signer);
    return processQueue(asset.checkpoints.create, { signer: address }, {});
  }

  public async createScheduleByTicker(
    ticker: string,
    createCheckpointScheduleDto: CreateCheckpointScheduleDto
  ): Promise<QueueResult<CheckpointSchedule>> {
    const { signer, ...rest } = createCheckpointScheduleDto;
    const asset = await this.assetsService.findOne(ticker);
    const address = this.relayerAccountsService.findAddressByDid(signer);
    return processQueue(asset.checkpoints.schedules.create, rest, { signer: address });
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

  public async getCheckpointHolders(
    ticker: string,
    checkpointId: BigNumber,
    size: number,
    start?: string
  ): Promise<ResultSet<IdentityBalance>> {
    const checkpoint = await this.findOne(ticker, checkpointId);
    return checkpoint.allBalances({ start, size });
  }

  public async deleteScheduleByTicker(
    ticker: string,
    id: BigNumber,
    signer: string
  ): Promise<QueueResult<void>> {
    const address = this.relayerAccountsService.findAddressByDid(signer);
    const asset = await this.assetsService.findOne(ticker);
    return processQueue(asset.checkpoints.schedules.remove, { schedule: id }, { signer: address });
  }
}
