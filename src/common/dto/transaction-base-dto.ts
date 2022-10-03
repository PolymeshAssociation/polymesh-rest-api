/* istanbul ignore file */

import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class TransactionBaseDto {
  @ApiProperty({
    description: 'An identifier for the account that should sign the transaction',
    example: 'alice',
  })
  @IsString()
  readonly signer: string;

  // Hide the property so the interactive examples work without additional setup
  @ApiHideProperty()
  @IsOptional()
  @IsString()
  @IsUrl()
  readonly webhookUrl?: string;
}
