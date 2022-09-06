/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class TransactionBaseDto {
  @ApiProperty({
    description: 'An identifier for the account that should sign the transaction',
    example: 'alice',
  })
  @IsString()
  readonly signer: string;

  @ApiProperty({
    description: 'An optional webhook URL to post the results of the transaction too',
    example: 'http://example.com/webhook',
  })
  @IsOptional()
  @IsString()
  readonly webhookUrl?: string;
}
