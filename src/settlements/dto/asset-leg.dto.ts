/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { IsTicker } from '~/common/decorators/validation';

export enum LegType {
  OFF_CHAIN = 'offchain',
  ON_CHAIN = 'onchain',
}

export class AssetLegDto {
  @ApiProperty({
    description: 'Ticker of the Asset',
    example: 'TICKER',
  })
  @IsTicker()
  readonly asset: string;

  @ApiProperty({
    description: 'Indicator to know if the transfer is onchain or offchain',
    enum: LegType,
    type: 'string',
    example: LegType.ON_CHAIN,
  })
  readonly type: LegType;

  constructor(dto: AssetLegDto) {
    Object.assign(this, dto);
  }
}
