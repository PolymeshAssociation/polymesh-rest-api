/* istanbul ignore file */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { IsAsset } from '~/common/decorators/validation';

export class GetTransactionsDto {
  @ApiPropertyOptional({
    description: 'Account address involved in transactions',
    example: '5grwXxxXxxXxxXxxXxxXxxXxxXxxXxxXxxXxxXxxXxxXxxXx',
  })
  @IsOptional()
  @IsString()
  readonly account?: string;

  @ApiPropertyOptional({
    description: 'Asset ticker for which the transactions were made',
    example: '123',
  })
  @IsOptional()
  @IsAsset()
  readonly asset?: string;
}
