/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsOptional, IsString } from 'class-validator';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { getNextYearISO } from '~/common/utils';

export class RotatePrimaryKeyParamsDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'Account address which will become the primary key',
    example: '5grwXxxXxxXxxXxxXxxXxxXxxXxxXxxXxxXxxXxxXxxXxxXx',
  })
  @IsString()
  readonly targetAccount: string;

  @ApiPropertyOptional({
    description: 'Date at which the Identity will expire',
    example: getNextYearISO(),
    type: 'string',
  })
  @IsOptional()
  @IsDate()
  readonly expiry?: Date;
}
