/* istanbul ignore file */

import { IsTicker } from '~/common/decorators/validation';

export class TickerParamsDto {
  @IsTicker()
  readonly ticker: string;
}
