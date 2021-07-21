/** istanbul ignore file */

import {
  DefaultPortfolio,
  Identity,
  NumberedPortfolio,
  PortfolioBalance,
} from '@polymathnetwork/polymesh-sdk/types';
import { merge } from 'lodash';

import { PortfolioModel } from '~/portfolios/models/portfolio.model';
import { TokenBalanceModel } from '~/tokens/models/token-balance.model';

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

  const portfolioModel = new PortfolioModel({
    id: portfolioId,
    name,
    tokenBalances: tokenBalances.map(
      ({ token, total, free, locked }) =>
        new TokenBalanceModel({
          token,
          total,
          free,
          locked,
        })
    ),
  });
  if (custodian.did !== did) {
    merge(portfolioModel, { custodian });
  }
  return portfolioModel;
}
