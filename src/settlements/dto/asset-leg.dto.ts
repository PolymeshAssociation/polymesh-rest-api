/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { LegType } from '~/common/types';

export class AssetLegTypeDto {
  @ApiProperty({
    description: 'Indicator to know if the transfer is on chain or off chain',
    enum: LegType,
    type: 'string',
  })
  @IsEnum(LegType)
  readonly type: LegType;
}
