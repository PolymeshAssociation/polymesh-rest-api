/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { ScopeType } from '@polymeshassociation/polymesh-sdk/types';

export class ScopeModel {
  @ApiProperty({
    description:
      'The type of Scope. If `Identity` then `value` should be a DID. If `Ticker` then `value` should be a Ticker',
    enum: ScopeType,
    example: ScopeType.Identity,
  })
  readonly type: ScopeType;

  @ApiProperty({
    type: 'string',
    example: '0x6'.padEnd(66, '1a'),
    description:
      'The value of the Scope. This is a hex prefixed 64 character string for `Identity`, 12 uppercase letters for Ticker',
  })
  readonly value: string;

  constructor(model: ScopeModel) {
    Object.assign(this, model);
  }
}
