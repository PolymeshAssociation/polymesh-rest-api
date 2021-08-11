/* istanbul ignore file */

import { BigNumber } from '@polymathnetwork/polymesh-sdk';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';

export class IdParams {
  @IsBigNumber()
  @ToBigNumber()
  readonly id: BigNumber;
}
