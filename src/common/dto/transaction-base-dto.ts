/* istanbul ignore file */

import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUrl } from 'class-validator';

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

  @ApiProperty({
    description:
      'An optional property that when set to `true` will will verify the validity of the transaction without submitting it to the chain',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  readonly dryRun?: boolean;
}
