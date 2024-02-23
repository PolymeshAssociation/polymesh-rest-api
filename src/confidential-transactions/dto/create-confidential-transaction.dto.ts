/* istanbul ignore file */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsByteLength, IsOptional, IsString, ValidateNested } from 'class-validator';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { ConfidentialTransactionLegDto } from '~/confidential-transactions/dto/confidential-transaction-leg.dto';

export class CreateConfidentialTransactionDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'List of Confidential Asset movements',
    type: ConfidentialTransactionLegDto,
    isArray: true,
  })
  @ValidateNested({ each: true })
  @Type(() => ConfidentialTransactionLegDto)
  readonly legs: ConfidentialTransactionLegDto[];

  @ApiPropertyOptional({
    description: 'Identifier string to help differentiate transactions. Maximum 32 bytes',
    type: 'string',
    example: 'Transfer of GROWTH Asset',
  })
  @IsOptional()
  @IsString()
  @IsByteLength(0, 32)
  readonly memo?: string;
}
