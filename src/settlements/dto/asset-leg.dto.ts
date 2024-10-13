/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { IsAsset } from '~/common/decorators/validation';
import { LegType } from '~/common/types';

export class AssetLegDto {
  @ApiProperty({
    description: 'Ticker of the Asset',
    example: 'TICKER',
  })
  @IsAsset()
  readonly asset: string;

  @ApiProperty({
    description: 'Indicator to know if the transfer is on chain or off chain',
    enum: LegType,
    type: 'string',
  })
  @IsEnum(LegType)
  readonly type: LegType;
}
