/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

import { IsDid } from '~/common/decorators/validation';
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
    description: 'List of auditor Confidential Accounts for the Confidential Asset',
    isArray: true,
    type: 'string',
    example: ['0xdeadbeef00000000000000000000000000000000000000000000000000000000'],
  })
  @IsArray()
  @IsString({ each: true })
  readonly auditors: string[];

  @ApiPropertyOptional({
    description: 'List of mediator DIDs for the Confidential Asset',
    isArray: true,
    type: 'string',
    example: ['0x0600000000000000000000000000000000000000000000000000000000000000'],
  })
  @IsOptional()
  @IsArray()
  @IsDid({ each: true })
  readonly mediators?: string[];
}
