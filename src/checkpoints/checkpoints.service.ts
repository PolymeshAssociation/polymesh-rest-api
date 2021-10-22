import { Injectable } from '@nestjs/common';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import {
  CheckpointWithData,
  ResultSet,
  ScheduleWithDetails,
} from '@polymathnetwork/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';

@Injectable()
export class CheckpointsService {
  constructor(private readonly assetsService: AssetsService) {}

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

  public async findScheduleByTicker(ticker: string, id: BigNumber): Promise<ScheduleWithDetails> {
    const asset = await this.assetsService.findOne(ticker);
    return asset.checkpoints.schedules.getOne({ id });
  }
}
