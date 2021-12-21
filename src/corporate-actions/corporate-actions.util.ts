/* istanbul ignore file */

import { DistributionWithDetails, DividendDistribution } from '@polymathnetwork/polymesh-sdk/types';

import { DividendDistributionDetailsModel } from '~/corporate-actions/model/dividend-distribution-details.model';
import { DividendDistributionModel } from '~/corporate-actions/model/dividend-distribution.model';
import { createPortfolioIdentifierModel } from '~/portfolios/portfolios.util';

export function createDividendDistributionModel(
  distribution: DividendDistribution
): DividendDistributionModel {
  const {
    origin,
    currency,
    perShare,
    maxAmount,
    expiryDate,
    paymentDate,
    id,
    token: { ticker },
    declarationDate,
    description,
    targets,
    defaultTaxWithholding,
    taxWithholdings,
  } = distribution;
  return new DividendDistributionModel({
    origin: createPortfolioIdentifierModel(origin),
    currency,
    perShare,
    maxAmount,
    expiryDate,
    paymentDate,
    id,
    ticker,
    declarationDate,
    description,
    targets,
    defaultTaxWithholding,
    taxWithholdings,
  });
}

export function createDividendDistributionDetailsModel(
  distributionWithDetails: DistributionWithDetails
): DividendDistributionDetailsModel {
  const { distribution, details } = distributionWithDetails;

  return new DividendDistributionDetailsModel({
    distribution: createDividendDistributionModel(distribution),
    ...details,
  });
}
