/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { SecondaryKeyModel } from '~/identities/models/secondary-key.model';

export class IdentityModel {
  @ApiProperty({
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
    description: 'Unique identity key',
  })
  did: string;

  @ApiProperty({
    type: 'string',
    description: 'Primary key of the identity',
    example: '5grwXxxXxxXxxXxxXxxXxxXxxXxxXxxXxxXxxXxxXxxXxxXx',
  })
  primaryKey: string;

  @ApiProperty({
    description: 'Secondary keys of the identity',
  })
  secondaryKeys?: SecondaryKeyModel[];

  @ApiProperty({
    type: 'boolean',
    description: 'Indicator to know if secondary keys are frozen or not',
  })
  secondaryKeysFrozen: boolean;
}
