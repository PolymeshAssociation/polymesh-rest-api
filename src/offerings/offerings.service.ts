import { Injectable, NotFoundException } from '@nestjs/common';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { ResultSet, StoStatus, StoWithDetails } from '@polymathnetwork/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { InvestmentModel } from '~/offerings/models/investment.model';

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

  public async findOne(ticker: string, id: BigNumber): Promise<StoWithDetails> {
    const offerings = await this.findAllByTicker(ticker);
    const offering = offerings.find(o => o.sto.id.eq(id));
    if (!offering) {
      throw new NotFoundException(`Offering with ID "${id}" for Asset "${ticker}" was not found`);
    }
    return offering;
  }

  public async findInvestmentsByTicker(
    ticker: string,
    id: BigNumber,
    size: number,
    start?: number
  ): Promise<ResultSet<InvestmentModel>> {
    const offering = await this.findOne(ticker, id);
    return offering.sto.getInvestments({ size, start });
  }
}
