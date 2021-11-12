import { Injectable } from '@nestjs/common';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { Checkpoint } from '@polymathnetwork/polymesh-sdk/internal';
import {
  CheckpointSchedule,
  CheckpointWithData,
  ResultSet,
  ScheduleWithDetails,
} from '@polymathnetwork/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { SignerDto } from '~/common/dto/signer.dto';
import { QueueResult } from '~/common/types';
import { processQueue } from '~/common/utils/utils';
import { RelayerAccountsService } from '~/relayer-accounts/relayer-accounts.service';

import { CreateCheckpointScheduleDto } from './dto/create-checkpoint-schedule.dto';

@Injectable()
export class CheckpointsService {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly relayerAccountsService: RelayerAccountsService
  ) {}

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
