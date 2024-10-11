/* istanbul ignore file */

import {
  DistributionWithDetails,
  DividendDistribution,
} from '@polymeshassociation/polymesh-sdk/types';

import { DividendDistributionModel } from '~/corporate-actions/models/dividend-distribution.model';
import { DividendDistributionDetailsModel } from '~/corporate-actions/models/dividend-distribution-details.model';
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
    asset: { id: assetId },
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
    asset: assetId,
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
    ...createDividendDistributionModel(distribution),
    ...details,
  });
}
