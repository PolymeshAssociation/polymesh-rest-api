/* istanbul ignore file */

import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsAsset, IsBigNumber } from '~/common/decorators/validation';

export class NftParamsDto {
  @IsAsset()
  readonly asset: string;

  @IsBigNumber()
  @ToBigNumber()
  readonly id: BigNumber;
}
