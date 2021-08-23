import { Injectable } from '@nestjs/common';
import { CorporateActionDefaults } from '@polymathnetwork/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';

@Injectable()
export class CorporateActionsService {
  constructor(private readonly assetsService: AssetsService) {}

  public async findDefaultsByTicker(ticker: string): Promise<CorporateActionDefaults> {
    const asset = await this.assetsService.findOne(ticker);
    return asset.corporateActions.getDefaults();
  }
}
