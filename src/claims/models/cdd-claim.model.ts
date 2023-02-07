/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { ClaimType } from '@polymeshassociation/polymesh-sdk/types';

export class CddClaimModel {
  @ApiProperty({
    type: 'string',
    description: 'Claim type',
    example: 'CustomerDueDiligence',
  })
  readonly type: ClaimType.CustomerDueDiligence;

  @ApiProperty({
    type: 'string',
    description: 'ID of the Claim',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  readonly id: string;

  constructor(model: CddClaimModel) {
    Object.assign(this, model);
  }
}
