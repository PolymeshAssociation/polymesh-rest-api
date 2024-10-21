import { Injectable } from '@nestjs/common';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  OfferingStatus,
  OfferingWithDetails,
  ResultSet,
} from '@polymeshassociation/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { AppNotFoundError } from '~/common/errors';
import { InvestmentModel } from '~/offerings/models/investment.model';

@Injectable()
export class OfferingsService {
  constructor(private readonly assetsService: AssetsService) {}

  public async findAllByAsset(
    ticker: string,
    stoStatus?: Partial<OfferingStatus>
  ): Promise<OfferingWithDetails[]> {
    const asset = await this.assetsService.findFungible(ticker);
    return asset.offerings.get({ status: stoStatus });
  }

  public async findOne(ticker: string, id: BigNumber): Promise<OfferingWithDetails> {
    const offerings = await this.findAllByAsset(ticker);
    const offering = offerings.find(({ offering: { id: offeringId } }) => offeringId.eq(id));
    if (!offering) {
      throw new AppNotFoundError(id.toString(), `Asset "${ticker}" Offering`);
    }
    return offering;
  }

  public async findInvestmentsByAsset(
    ticker: string,
    id: BigNumber,
    size: BigNumber,
    start?: BigNumber
  ): Promise<ResultSet<InvestmentModel>> {
    const { offering } = await this.findOne(ticker, id);
    return offering.getInvestments({ size, start });
  }
}
