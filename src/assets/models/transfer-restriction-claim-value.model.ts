/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  ClaimType,
  Identity,
  TransferRestrictionType,
} from '@polymeshassociation/polymesh-sdk/types';
import { Type } from 'class-transformer';

import { StatClaimModel } from '~/assets/models/stat-claim.model';
import { StatAccreditedClaimModel } from '~/assets/models/stat-claim-accredited.model';
import { StatAffiliateClaimModel } from '~/assets/models/stat-claim-affiliate.model';
import { StatJurisdictionClaimModel } from '~/assets/models/stat-claim-jurisdiction.model';
import { ApiPropertyOneOf } from '~/common/decorators';
import { FromEntity } from '~/common/decorators/transformation';

export class TransferRestrictionClaimValueModel {
  declare readonly type: TransferRestrictionType.ClaimCount;

  @ApiProperty({
    description: 'The claim count/percentage restriction value',
    example: '10',
    type: 'object',
  })
  readonly min: BigNumber;

  @ApiProperty({
    description: 'The maximum claim count/percentage restriction value',
    example: '40',
    type: 'object',
  })
  readonly max: BigNumber;

  @ApiProperty({
    description: 'The DID of the claim issuer',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @FromEntity()
  readonly issuer: Identity;

  @ApiPropertyOneOf({
    description: 'The claim associated with the transfer restriction',
    union: [
      StatAccreditedClaimModel,
      StatAffiliateClaimModel,
      StatJurisdictionClaimModel,
    ],
  })
  @Type(() => StatClaimModel, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'type',
      subTypes: [
        {
          value: StatAccreditedClaimModel,
          name: ClaimType.Accredited,
        },
        {
          value: StatAffiliateClaimModel,
          name: ClaimType.Affiliate,
        },
        {
          value: StatJurisdictionClaimModel,
          name: ClaimType.Jurisdiction,
        },
      ],
    },
  })
  readonly claim: StatClaimModel;

  constructor(model: TransferRestrictionClaimValueModel) {
    Object.assign(this, model);
  }
}
