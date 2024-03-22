/** istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

export class PreApprovedModel {
  @ApiProperty({
    description: 'The ticker that is subject to pre-approval',
    example: 'TICKER',
  })
  readonly ticker: string;

  @ApiProperty({
    description: 'The DID for whom the asset is pre-approved for',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  readonly did: string;

  @ApiProperty({
    description: 'Whether or not the asset is pre-approved',
    example: true,
  })
  isPreApproved: boolean;

  constructor(model: PreApprovedModel) {
    Object.assign(this, model);
  }
}
