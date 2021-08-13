/* istanbul ignore file */

import { StoWithDetails } from '@polymathnetwork/polymesh-sdk/types';

import { OfferingDetailsModel } from '~/offerings/models/offering-details.model';
import { TierModel } from '~/offerings/models/tier.model';

export function createOfferingDetailsModel(stoWithDetails: StoWithDetails): OfferingDetailsModel {
  const {
    sto,
    details: { tiers, ...rest },
  } = stoWithDetails;
  return new OfferingDetailsModel({
    id: sto.id,
    tiers: tiers.map(tier => new TierModel(tier)),
    ...rest,
  });
}
