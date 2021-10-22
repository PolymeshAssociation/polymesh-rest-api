import { Injectable } from '@nestjs/common';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import {
  CorporateActionDefaults,
  DistributionWithDetails,
} from '@polymathnetwork/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { createDividendDistributionModel } from '~/corporate-actions/corporate-actions.util';
import { DividendDistributionModel } from '~/corporate-actions/model/dividend-distribution.model';

@Injectable()
export class CorporateActionsService {
  constructor(private readonly assetsService: AssetsService) {}

  public async findDefaultsByTicker(ticker: string): Promise<CorporateActionDefaults> {
    const asset = await this.assetsService.findOne(ticker);
    return asset.corporateActions.getDefaults();
  }

  public async findDistributionsByTicker(ticker: string): Promise<DistributionWithDetails[]> {
    const asset = await this.assetsService.findOne(ticker);
    return asset.corporateActions.distributions.get();
  }

  public async findDistribution(
    ticker: string,
    id: BigNumber
  ): Promise<DividendDistributionModel | undefined> {
    const distributions = await this.findDistributionsByTicker(ticker);

    return distributions
      .map(distributionWithDetails => createDividendDistributionModel(distributionWithDetails))
      .find((dd: DividendDistributionModel) => dd.id.eq(id));
  }
}
