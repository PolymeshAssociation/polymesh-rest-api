/* istanbul ignore file */

import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';

import { ProcessMode } from '~/common/types';

export class TransactionOptionsDto {
  @ApiProperty({
    description: 'An identifier or address for the account that should sign the transaction',
    example: 'alice',
  })
  @IsString()
  readonly signer: string;

  @ApiProperty({
    description: 'How the transaction should be processed',
    enum: ProcessMode,
  })
  @IsEnum(ProcessMode)
  readonly processMode: ProcessMode;

  // Hide the property so the interactive examples work without additional setup
  @ApiHideProperty()
  @ValidateIf(({ processMode }) => processMode === ProcessMode.SubmitWithCallback)
  @IsString()
  @IsUrl()
  readonly webhookUrl?: string;

  @ApiHideProperty()
  @ValidateIf(({ processMode }) => processMode === ProcessMode.Offline)
  @IsOptional()
  @IsObject()
  readonly metadata?: Record<string, string>;
}
