/* istanbul ignore file */

import { IsHexadecimal } from 'class-validator';

export class TransactionHashParamsDto {
  @IsHexadecimal()
  readonly hash: string;
}
