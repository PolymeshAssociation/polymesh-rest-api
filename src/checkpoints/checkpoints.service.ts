import { Injectable, NotFoundException } from '@nestjs/common';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { Checkpoint } from '@polymathnetwork/polymesh-sdk/internal';
import {
  CheckpointSchedule,
  CheckpointWithData,
  ErrorCode,
  isPolymeshError,
  ResultSet,
  ScheduleWithDetails,
} from '@polymathnetwork/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
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
          this.logger.error(`No Schedule exists for ticker "${ticker}" with ID "${id}"`);
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
    return processQueue(asset.checkpoints.create, undefined, { signer: address });
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
}
