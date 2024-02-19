/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

import { IsDid, IsTicker } from '~/common/decorators/validation';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class CreateConfidentialAssetDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'Custom data to be associated with the Confidential Asset',
    example: 'Some Random Data',
    type: 'string',
  })
  @IsString()
  readonly data: string;

  @ApiProperty({
    description: 'The ticker value to be associated with the Confidential Asset',
    type: 'string',
    example: 'TICKER',
  })
  @IsTicker()
  @IsOptional()
  readonly ticker?: string;

  @ApiProperty({
    description: 'List of auditors for the Confidential Asset',
    isArray: true,
    type: 'string',
    example: ['0xdeadbeef00000000000000000000000000000000000000000000000000000000'],
  })
  @IsString()
  @IsArray()
  readonly auditors: string[];

  @ApiPropertyOptional({
    description: 'List of mediators for the Confidential Asset',
    isArray: true,
    type: 'string',
    example: ['0x0600000000000000000000000000000000000000000000000000000000000000'],
  })
  @IsOptional()
  @IsArray()
  @IsDid()
  readonly mediators?: string[];
}
