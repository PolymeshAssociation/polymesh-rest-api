/* istanbul ignore file */

import { OfferingWithDetails } from '@polymeshassociation/polymesh-sdk/types';

import { OfferingDetailsModel } from '~/offerings/models/offering-details.model';
import { TierModel } from '~/offerings/models/tier.model';
import { createPortfolioIdentifierModel } from '~/portfolios/portfolios.util';

export function createOfferingDetailsModel(
  offeringWithDetails: OfferingWithDetails
): OfferingDetailsModel {
  const {
    offering: { id },
    details: { tiers, raisingPortfolio, offeringPortfolio, ...rest },
  } = offeringWithDetails;
  return new OfferingDetailsModel({
    id,
    tiers: tiers.map(tier => new TierModel(tier)),
    offeringPortfolio: createPortfolioIdentifierModel(offeringPortfolio),
    raisingPortfolio: createPortfolioIdentifierModel(raisingPortfolio),
    ...rest,
  });
}
