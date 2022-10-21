/* istanbul ignore file */
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { TickerParamsDto } from '~/assets/dto/ticker-params.dto';
import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';

export class RequirementParamsDto extends TickerParamsDto {
  @ToBigNumber()
  @IsBigNumber()
  readonly id: BigNumber;
}
