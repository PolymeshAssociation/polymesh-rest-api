import { Injectable } from '@nestjs/common';
import {
  CorporateActionDefaults,
  DistributionWithDetails,
  DividendDistribution,
} from '@polymathnetwork/polymesh-sdk/types';

import { AssetsService } from '~/assets/assets.service';
import { QueueResult } from '~/common/types';
import { processQueue } from '~/common/utils/utils';
import { CorporateActionDefaultsDto } from '~/corporate-actions/dto/corporate-action-defaults.dto';
import { DividendDistributionDto } from '~/corporate-actions/dto/dividend-distribution.dto';
import { toPortfolioId } from '~/portfolios/portfolios.util';
import { RelayerAccountsService } from '~/relayer-accounts/relayer-accounts.service';

@Injectable()
export class CorporateActionsService {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly relayerAccountsService: RelayerAccountsService
  ) {}

  public async findDefaultsByTicker(ticker: string): Promise<CorporateActionDefaults> {
    const asset = await this.assetsService.findOne(ticker);
    return asset.corporateActions.getDefaults();
  }

  public async updateDefaultsByTicker(
    ticker: string,
    corporateActionDefaultsDto: CorporateActionDefaultsDto
  ): Promise<QueueResult<void>> {
    const { signer, ...rest } = corporateActionDefaultsDto;
    const asset = await this.assetsService.findOne(ticker);
    const address = this.relayerAccountsService.findAddressByDid(signer);
    return processQueue(asset.corporateActions.setDefaults, rest as Required<typeof rest>, {
      signer: address,
    });
  }

  public async findDistributionsByTicker(ticker: string): Promise<DistributionWithDetails[]> {
    const asset = await this.assetsService.findOne(ticker);
    return asset.corporateActions.distributions.get();
  }

  public async createDividendDistributionByTicker(
    ticker: string,
    dividendDistributionDto: DividendDistributionDto
  ): Promise<QueueResult<DividendDistribution>> {
    const { signer, originPortfolio, ...rest } = dividendDistributionDto;
    const asset = await this.assetsService.findOne(ticker);
    const address = this.relayerAccountsService.findAddressByDid(signer);
    return processQueue(
      asset.corporateActions.distributions.configureDividendDistribution,
      {
        originPortfolio: toPortfolioId(originPortfolio),
        ...rest,
      },
      {
        signer: address,
      }
    );
  }
}
