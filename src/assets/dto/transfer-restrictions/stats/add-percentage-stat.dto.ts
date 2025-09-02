/* istanbul ignore file */

import { StatType } from '@polymeshassociation/polymesh-sdk/types';

import { AssetStatBaseDto } from '~/assets/dto/transfer-restrictions/stats/asset-stat-base.dto';

export class AddPercentageStatDto extends AssetStatBaseDto {
  declare readonly type: StatType.Balance;
}
