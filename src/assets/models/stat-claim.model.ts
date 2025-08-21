/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { ClaimType } from '@polymeshassociation/polymesh-sdk/types';

export class StatClaimModel {
  @ApiProperty({
    description: 'Type of input stat claim',
    enum: [ClaimType.Jurisdiction, ClaimType.Accredited, ClaimType.Affiliate],
    example: ClaimType.Accredited,
  })
  readonly type: ClaimType;

  constructor(model: StatClaimModel) {
    Object.assign(this, model);
  }
}
