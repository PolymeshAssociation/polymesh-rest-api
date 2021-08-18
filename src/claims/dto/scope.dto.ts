/* istanbul ignore file */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { ScopeType } from '@polymathnetwork/polymesh-sdk/types';
import { IsEnum, IsString } from 'class-validator';

export class ScopeDto {
  @ApiPropertyOptional({
    description: 'The type of Scope',
    enum: ScopeType,
    example: ScopeType.Identity,
  })
  @IsEnum(ScopeType)
  type: ScopeType;

  @ApiPropertyOptional({
    description: 'The value of the Scope',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @IsString()
  value: string;
}
