/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { StatType } from '@polymeshassociation/polymesh-sdk/types';

import { AssetStatBaseDto } from '~/assets/dto/transfer-restrictions/stats/asset-stat-base.dto';
import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';

export class AddCountStatDto extends AssetStatBaseDto {
  declare readonly type: StatType.Count;

  @ApiProperty({
    description:
      'Initial investor count to set for Count stat. Must be provided when enabling Count',
    type: 'string',
    example: '100',
  })
  @ToBigNumber()
  @IsBigNumber()
  readonly count: BigNumber;
}
