import { Injectable } from '@nestjs/common';
import { CheckpointWithData, ResultSet } from '@polymathnetwork/polymesh-sdk/types';

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
}
