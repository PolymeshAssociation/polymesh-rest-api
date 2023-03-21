/* istanbul ignore file */

import { IsHexadecimal, Length } from 'class-validator';

import { TRANSACTION_HASH_LENGTH } from '~/transactions/transactions.consts';

export class TransactionHashParamsDto {
  @IsHexadecimal()
  @Length(TRANSACTION_HASH_LENGTH)
  readonly hash: string;
}
