/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Scope } from '@polymeshassociation/polymesh-sdk/types';

export class ClaimScopeModel {
  @ApiProperty({
    description: 'The scope that has been assigned to Identity',
    example: {
      type: 'Identity',
      value: '0x6'.padEnd(66, '1a'),
    },
  })
  readonly scope: Scope | null;

  @ApiPropertyOptional({
    description: 'The ticker to which the scope is valid for',
    example: 'TICKER',
  })
  readonly ticker?: string;

  constructor(model: ClaimScopeModel) {
    Object.assign(this, model);
  }
}

export interface ClaimScope {
  scope: Scope | null;
  ticker?: string;
}
