/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { ClaimType } from '@polymeshassociation/polymesh-sdk/types';

import { StatClaimModel } from '~/assets/models/stat-claim.model';

export class StatAffiliateClaimModel extends StatClaimModel {
  declare readonly type: ClaimType.Affiliate;

  @ApiProperty({
    description: 'Whether the Identity is an affiliate',
    type: 'boolean',
    example: true,
  })
  readonly affiliate: boolean;

  constructor(model: StatAffiliateClaimModel) {
    super(model);

    Object.assign(this, model);
  }
}
