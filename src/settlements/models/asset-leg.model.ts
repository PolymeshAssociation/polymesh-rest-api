/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { LegType } from '~/common/types';

export class AssetLegModel {
  @ApiProperty({
    description: 'Ticker of the Asset',
    example: 'TICKER',
  })
  readonly asset: string;

  // decorator is defined in parent class, to show example value correctly
  readonly type: LegType;

  constructor(dto: AssetLegModel) {
    Object.assign(this, dto);
  }
}
