/* istanbul ignore file */

import { IsString } from 'class-validator';

export class TransactionHashParamsDto {
  @IsString()
  readonly hash: string;
}
