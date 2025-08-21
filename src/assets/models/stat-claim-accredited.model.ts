/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { ClaimType } from '@polymeshassociation/polymesh-sdk/types';

import { StatClaimModel } from '~/assets/models/stat-claim.model';

export class StatAccreditedClaimModel extends StatClaimModel {
  declare readonly type: ClaimType.Accredited;

  @ApiProperty({
    description: 'Whether the Identity is accredited',
    type: 'boolean',
    example: true,
  })
  readonly accredited: boolean;

  constructor(model: StatAccreditedClaimModel) {
    super(model);

    Object.assign(this, model);
  }
}
