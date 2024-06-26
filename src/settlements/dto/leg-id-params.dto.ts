/* istanbul ignore file */

import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';
import { IdParamsDto } from '~/common/dto/id-params.dto';

export class LegIdParamsDto extends IdParamsDto {
  @IsBigNumber()
  @ToBigNumber()
  readonly legId: BigNumber;
}
