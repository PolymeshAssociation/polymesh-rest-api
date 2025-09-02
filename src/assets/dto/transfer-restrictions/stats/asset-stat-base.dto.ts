/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { StatType } from '@polymeshassociation/polymesh-sdk/types';
import { IsEnum } from 'class-validator';

export class AssetStatBaseDto {
  @ApiProperty({
    description: 'Type of statistic to enable',
    enum: StatType,
    example: StatType.Count,
  })
  @IsEnum(StatType)
  readonly type: StatType;
}
