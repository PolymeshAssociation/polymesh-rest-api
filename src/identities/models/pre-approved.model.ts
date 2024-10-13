/** istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

export class PreApprovedModel {
  @ApiProperty({
    description:
      'The Asset that is subject to pre-approval. NOTE: For 6.x chains, asset is represented by its ticker, but from 7.x, asset is represented by its unique Asset ID',
    example: 'TICKER',
  })
  readonly asset: string;

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
