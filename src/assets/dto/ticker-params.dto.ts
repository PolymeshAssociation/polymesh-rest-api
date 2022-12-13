/* istanbul ignore file */

import { IsString } from 'class-validator';

export class TickerParamsDto {
  // @IsTicker()
  @IsString()
  readonly ticker: string;
}
