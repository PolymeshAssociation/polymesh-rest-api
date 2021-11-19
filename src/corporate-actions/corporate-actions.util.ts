/* istanbul ignore file */

import { DistributionWithDetails } from '@polymathnetwork/polymesh-sdk/types';

import { DividendDistributionModel } from '~/corporate-actions/model/dividend-distribution.model';
import { createPortfolioIdentifierModel } from '~/portfolios/portfolios.util';

export function createDividendDistributionModel(
  distributionWithDetails: DistributionWithDetails
): DividendDistributionModel {
  const {
    distribution: {
      origin,
      currency,
      perShare,
      maxAmount,
      expiryDate,
      paymentDate,
      id,
      token,
      declarationDate,
      description,
      targets,
      defaultTaxWithholding,
      taxWithholdings,
    },
    details,
  } = distributionWithDetails;

  return new DividendDistributionModel({
    origin: createPortfolioIdentifierModel(origin),
    currency,
    perShare,
    maxAmount,
    expiryDate,
    paymentDate,
    id,
    ticker: token?.ticker,
    declarationDate,
    description,
    targets,
    defaultTaxWithholding,
    taxWithholdings,
    ...details,
  });
}
