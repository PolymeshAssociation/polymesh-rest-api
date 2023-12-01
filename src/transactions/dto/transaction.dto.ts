/* istanbul ignore file */

import { IsHexadecimal, IsObject, IsOptional } from 'class-validator';

export class TransactionDto {
  @IsHexadecimal()
  readonly method: string;

  @IsHexadecimal()
  readonly signature: string;

  @IsObject()
  readonly payload: Record<string, string>;

  @IsOptional()
  readonly rawPayload?: Record<string, string>;

  @IsOptional()
  readonly metadata?: Record<string, string>;
}
