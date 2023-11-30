/* istanbul ignore file */

import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber, IsTicker } from '~/common/decorators/validation';

export class NftParamsDto {
  @IsTicker()
  readonly ticker: string;

  @IsBigNumber()
  @ToBigNumber()
  readonly id: BigNumber;
}
