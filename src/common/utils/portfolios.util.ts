/** istanbul ignore file */

import { DefaultPortfolio, NumberedPortfolio } from '@polymathnetwork/polymesh-sdk/types';

import { PortfolioModel } from '~/common/models/portfolio.model';
import { TokenBalanceModel } from '~/tokens/models/token-balance.model';

export async function parsePortfolio(
  portfolio: DefaultPortfolio | NumberedPortfolio,
  did: string
): Promise<PortfolioModel> {
  const parsedPortfolio = new PortfolioModel();
  if ((<NumberedPortfolio>portfolio).getName) {
    const numberedPortfolio = <NumberedPortfolio>portfolio;
    parsedPortfolio.id = await numberedPortfolio.id;
    parsedPortfolio.name = await numberedPortfolio.getName();
  } else {
    parsedPortfolio.name = 'default';
  }
  const tokenBalances = await portfolio.getTokenBalances();
  parsedPortfolio.tokenBalances = [] as TokenBalanceModel[];
  for (const tb of tokenBalances) {
    // const tokenDetails = await tb.token.details();
    // const tokenDetailsDto = new TokenDetailsModel();
    // tokenDetailsDto.name = tokenDetails.name;
    // tokenDetailsDto.assetType = tokenDetails.assetType;
    parsedPortfolio.tokenBalances.push(
      new TokenBalanceModel({
        total: tb.total,
        free: tb.free,
        locked: tb.locked,
      })
    );
  }
  const isCustodian = await portfolio.isCustodiedBy({ identity: did });
  if (!isCustodian) {
    parsedPortfolio.custodian = await portfolio.getCustodian();
  }

  return parsedPortfolio;
}
