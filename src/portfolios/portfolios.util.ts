/** istanbul ignore file */

import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import {
  DefaultPortfolio,
  Identity,
  NumberedPortfolio,
  PortfolioBalance,
} from '@polymathnetwork/polymesh-sdk/types';
import { isNumberedPortfolio } from '@polymathnetwork/polymesh-sdk/utils';

import { AssetBalanceModel } from '~/assets/models/asset-balance.model';
import { PortfolioIdentifierModel } from '~/portfolios/models/portfolio-identifier.model';
import { PortfolioModel } from '~/portfolios/models/portfolio.model';

export async function createPortfolioModel(
  portfolio: DefaultPortfolio | NumberedPortfolio,
  did: string
): Promise<PortfolioModel> {
  let custodian: Identity;
  let tokenBalances: PortfolioBalance[];
  let name = 'default';

  let portfolioId;
  if (isNumberedPortfolio(portfolio)) {
    const numberedPortfolio = <NumberedPortfolio>portfolio;
    portfolioId = numberedPortfolio.id;
    [tokenBalances, custodian, name] = await Promise.all([
      portfolio.getTokenBalances(),
      portfolio.getCustodian(),
      numberedPortfolio.getName(),
    ]);
  } else {
    [tokenBalances, custodian] = await Promise.all([
      portfolio.getTokenBalances(),
      portfolio.getCustodian(),
    ]);
  }

  let portfolioModelParams: ConstructorParameters<typeof PortfolioModel>[0] = {
    id: portfolioId,
    name,
    assetBalances: tokenBalances.map(
      ({ token: asset, total, free, locked }) =>
        new AssetBalanceModel({
          asset,
          total,
          free,
          locked,
        })
    ),
    owner: portfolio.owner,
  };
  if (custodian.did !== did) {
    portfolioModelParams = { ...portfolioModelParams, custodian };
  }
  return new PortfolioModel(portfolioModelParams);
}

export function createPortfolioIdentifierModel(
  portfolio: DefaultPortfolio | NumberedPortfolio
): PortfolioIdentifierModel {
  return new PortfolioIdentifierModel(portfolio.toJson());
}

export function toPortfolioId(id: BigNumber): BigNumber | undefined {
  if (id.eq(0)) {
    return undefined;
  }
  return id;
}
