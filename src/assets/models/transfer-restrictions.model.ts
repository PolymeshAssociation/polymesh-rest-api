/* istanbul ignore file */

import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import {
  ActiveTransferRestrictions,
  ClaimType,
  Identity,
  InputStatClaim,
  TransferRestriction,
  TransferRestrictionType,
} from '@polymeshassociation/polymesh-sdk/types';
import { Type } from 'class-transformer';

import { StatClaimModel } from '~/assets/models/stat-claim.model';
import { StatAccreditedClaimModel } from '~/assets/models/stat-claim-accredited.model';
import { StatAffiliateClaimModel } from '~/assets/models/stat-claim-affiliate.model';
import { StatJurisdictionClaimModel } from '~/assets/models/stat-claim-jurisdiction.model';
import { TransferRestrictionModel } from '~/assets/models/transfer-restriction.model';
import { TransferRestrictionClaimCountModel } from '~/assets/models/transfer-restriction-claim-count.model';
import { TransferRestrictionClaimPercentageModel } from '~/assets/models/transfer-restriction-claim-percentage.model';
import { TransferRestrictionClaimValueModel } from '~/assets/models/transfer-restriction-claim-value.model';
import { TransferRestrictionCountModel } from '~/assets/models/transfer-restriction-count.model';
import { TransferRestrictionPercentageModel } from '~/assets/models/transfer-restriction-percentage.model';
import { ApiPropertyOneOf } from '~/common/decorators';

type ClaimRestrictionValue = {
  min: TransferRestrictionClaimValueModel['min'];
  max?: TransferRestrictionClaimValueModel['max'];
  issuer: Identity;
  claim: InputStatClaim;
};

function toStatClaimModel(claim: InputStatClaim): StatClaimModel {
  switch (claim.type) {
    case ClaimType.Accredited:
      return new StatAccreditedClaimModel({
        type: claim.type,
        accredited: claim.accredited,
      } as StatAccreditedClaimModel);
    case ClaimType.Affiliate:
      return new StatAffiliateClaimModel({
        type: claim.type,
        affiliate: claim.affiliate,
      } as StatAffiliateClaimModel);
    case ClaimType.Jurisdiction:
      return new StatJurisdictionClaimModel({
        type: claim.type,
        countryCode: claim.countryCode,
      } as StatJurisdictionClaimModel);
    default:
      return claim as unknown as StatClaimModel;
  }
}

function toClaimRestrictionValueModel(
  value: ClaimRestrictionValue
): TransferRestrictionClaimValueModel {
  return new TransferRestrictionClaimValueModel({
    min: value.min,
    max: value.max,
    issuer: value.issuer,
    claim: toStatClaimModel(value.claim),
  } as TransferRestrictionClaimValueModel);
}

function toTransferRestrictionModel(restriction: TransferRestriction): TransferRestrictionModel {
  const { exemptedIds } = restriction as { exemptedIds?: string[] };
  const common = {
    type: restriction.type,
    exemptedIds,
  } as TransferRestrictionModel;

  switch (restriction.type) {
    case TransferRestrictionType.Count:
      return new TransferRestrictionCountModel({
        ...common,
        value: restriction.value,
      } as TransferRestrictionCountModel);
    case TransferRestrictionType.Percentage:
      return new TransferRestrictionPercentageModel({
        ...common,
        value: restriction.value,
      } as TransferRestrictionPercentageModel);
    case TransferRestrictionType.ClaimCount:
      return new TransferRestrictionClaimCountModel({
        ...common,
        value: toClaimRestrictionValueModel(restriction.value as unknown as ClaimRestrictionValue),
      } as TransferRestrictionClaimCountModel);
    case TransferRestrictionType.ClaimPercentage:
      return new TransferRestrictionClaimPercentageModel({
        ...common,
        value: toClaimRestrictionValueModel(restriction.value as unknown as ClaimRestrictionValue),
      } as TransferRestrictionClaimPercentageModel);
    default:
      return restriction as unknown as TransferRestrictionModel;
  }
}

@ApiExtraModels(
  TransferRestrictionModel,
  TransferRestrictionCountModel,
  TransferRestrictionPercentageModel,
  TransferRestrictionClaimCountModel,
  TransferRestrictionClaimPercentageModel,
  TransferRestrictionClaimValueModel,
  StatClaimModel,
  StatAccreditedClaimModel,
  StatAffiliateClaimModel,
  StatJurisdictionClaimModel
)
export class TransferRestrictionsModel {
  @ApiProperty({
    description: 'Whether transfer rules are currently paused for the asset',
    type: 'boolean',
  })
  readonly paused: boolean;

  @ApiPropertyOneOf({
    description: 'Active transfer restrictions applied to the asset',
    isArray: true,
    union: [
      TransferRestrictionCountModel,
      TransferRestrictionPercentageModel,
      TransferRestrictionClaimCountModel,
      TransferRestrictionClaimPercentageModel,
    ],
  })
  @Type(() => TransferRestrictionModel, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'type',
      subTypes: [
        { name: TransferRestrictionType.Count, value: TransferRestrictionCountModel },
        { name: TransferRestrictionType.Percentage, value: TransferRestrictionPercentageModel },
        { name: TransferRestrictionType.ClaimCount, value: TransferRestrictionClaimCountModel },
        {
          name: TransferRestrictionType.ClaimPercentage,
          value: TransferRestrictionClaimPercentageModel,
        },
      ],
    },
  })
  readonly restrictions: TransferRestrictionModel[];

  constructor(model: ActiveTransferRestrictions) {
    this.paused = model.paused;
    this.restrictions = model.restrictions.map(toTransferRestrictionModel);
  }
}
