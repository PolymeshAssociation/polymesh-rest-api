/* istanbul ignore file */

import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, IsUrl, ValidateNested } from 'class-validator';

import { TransactionOptionsDto } from '~/common/dto/transaction-options.dto';

export class TransactionBaseDto {
  @ApiProperty({
    description:
      'Options to control the behavior of the transactions, such how or if it will be signed',
    type: TransactionOptionsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TransactionOptionsDto)
  options?: TransactionOptionsDto;

  @ApiProperty({
    description:
      '(Deprecated, embed in `options` object instead). An identifier for the account that should sign the transaction',
    example: 'alice',
    deprecated: true,
  })
  @IsOptional()
  @IsString()
  readonly signer?: string;

  // Hide the property so the interactive examples work without additional setup
  @ApiHideProperty()
  @IsOptional()
  @IsString()
  @IsUrl()
  readonly webhookUrl?: string;

  @ApiHideProperty()
  @IsBoolean()
  @IsOptional()
  readonly dryRun?: boolean;
}
