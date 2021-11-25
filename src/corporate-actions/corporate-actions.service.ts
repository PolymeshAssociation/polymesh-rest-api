import { Injectable, NotFoundException } from '@nestjs/common';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import {
  CorporateActionDefaults,
  DistributionWithDetails,
  ErrorCode,
} from '@polymathnetwork/polymesh-sdk/types';
import { isPolymeshError } from '@polymathnetwork/polymesh-sdk/utils';

import { AssetsService } from '~/assets/assets.service';

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

  public async findDistribution(ticker: string, id: BigNumber): Promise<DistributionWithDetails> {
    const asset = await this.assetsService.findOne(ticker);

    try {
      return await asset.corporateActions.distributions.getOne({ id });
    } catch (err: unknown) {
      if (isPolymeshError(err)) {
        const { code } = err;
        if (code === ErrorCode.DataUnavailable) {
          throw new NotFoundException(
            `The Dividend Distribution with id: "${id.toString()}" does not exist for ticker: "${ticker}"`
          );
        }
      }

      throw err;
    }
  }
}
