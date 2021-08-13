import { Injectable } from '@nestjs/common';
import { StoStatus, StoWithDetails } from '@polymathnetwork/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';

@Injectable()
export class OfferingsService {
  constructor(private readonly assetsService: AssetsService) {}

  public async findAllByTicker(
    ticker: string,
    stoStatus?: Partial<StoStatus>
  ): Promise<StoWithDetails[]> {
    const asset = await this.assetsService.findOne(ticker);
    return asset.offerings.get({ status: stoStatus });
  }
}
