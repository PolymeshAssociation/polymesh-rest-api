/** istanbul ignore file */

import {
  DefaultPortfolio,
  Identity,
  NumberedPortfolio,
  PortfolioBalance,
} from '@polymathnetwork/polymesh-sdk/types';

import { AssetBalanceModel } from '~/assets/models/asset-balance.model';
import { PortfolioModel } from '~/portfolios/models/portfolio.model';

export async function createPortfolioModel(
  portfolio: DefaultPortfolio | NumberedPortfolio,
  did: string
): Promise<PortfolioModel> {
  let custodian: Identity;
  let tokenBalances: PortfolioBalance[];
  let name = 'default';

  let portfolioId;
  // TODO @monitz87: replace with typeguard when they are implemented in the SDK
  if ((<NumberedPortfolio>portfolio).getName) {
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
