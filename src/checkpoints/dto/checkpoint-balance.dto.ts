/* istanbul ignore file */

import { BigNumber } from '@polymathnetwork/polymesh-sdk';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber, IsDid, IsTicker } from '~/common/decorators/validation';

export class CheckPointBalanceParamsDto {
  @IsTicker()
  readonly ticker: string;

  @IsDid()
  readonly did: string;

  @ToBigNumber()
  @IsBigNumber()
  readonly id: BigNumber;
}
