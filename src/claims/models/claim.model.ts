/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Claim, Identity } from '@polymeshassociation/polymesh-sdk/types';

import { FromEntity } from '~/common/decorators/transformation';

export class ClaimModel<T = Claim> {
  @ApiProperty({
    type: 'string',
    description: 'DID of the target Identity',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @FromEntity()
  readonly target: Identity;

  @ApiProperty({
    type: 'string',
    description: 'DID of the issuer Identity',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @FromEntity()
  readonly issuer: Identity;

  @ApiProperty({
    type: 'string',
    description: 'Date when the Claim was issued',
    example: new Date('10/14/1987').toISOString(),
  })
  readonly issuedAt: Date;

  @ApiProperty({
    type: 'string',
    nullable: true,
    description: 'Expiry date of the Claim',
    example: new Date('10/14/1987').toISOString(),
  })
  readonly expiry: Date | null;

  @ApiProperty({
    description: 'Details of the Claim containing type and scope',
    example: {
      type: 'Accredited',
      scope: {
        type: 'Identity',
        value: '0x6'.padEnd(66, '1a'),
      },
    },
  })
  readonly claim: T;

  constructor(model: ClaimModel) {
    Object.assign(this, model);
  }
}
