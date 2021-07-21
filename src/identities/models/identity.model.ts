/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { SecondaryKeyModel } from '~/identities/models/secondary-key.model';

export class IdentityModel {
  @ApiProperty({
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
    description: 'Unique Identity identifier (DID: Decentralized IDentity)',
  })
  readonly did: string;

  @ApiProperty({
    type: 'string',
    description: 'Primary key of the Identity',
    example: '5grwXxxXxxXxxXxxXxxXxxXxxXxxXxxXxxXxxXxxXxxXxxXx',
  })
  readonly primaryKey: string;

  @ApiProperty({
    description: 'Secondary keys of the Identity',
    type: () => SecondaryKeyModel,
    isArray: true,
  })
  @Type(() => SecondaryKeyModel)
  readonly secondaryKeys: SecondaryKeyModel[];

  @ApiProperty({
    type: 'boolean',
    description: 'Indicator to know if secondary keys are frozen or not',
    example: false,
  })
  readonly secondaryKeysFrozen: boolean;

  constructor(model: IdentityModel) {
    Object.assign(this, model);
  }
}
