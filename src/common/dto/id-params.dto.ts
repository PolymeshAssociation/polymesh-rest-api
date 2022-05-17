/* istanbul ignore file */

import { BigNumber } from '@polymathnetwork/polymesh-sdk';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsNumber } from '~/common/decorators/validation';

export class IdParamsDto {
  @IsNumber()
  @ToBigNumber()
  readonly id: BigNumber;
}
