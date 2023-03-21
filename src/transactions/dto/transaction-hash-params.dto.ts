/* istanbul ignore file */

import { IsHexadecimal, MaxLength } from 'class-validator';

import { MAX_HASH_LENGTH } from '~/transactions/transactions.consts';

export class TransactionHashParamsDto {
  @IsHexadecimal()
  @MaxLength(MAX_HASH_LENGTH)
  readonly hash: string;
}
