/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { ScopeType } from '@polymeshassociation/polymesh-sdk/types';
import { IsEnum } from 'class-validator';

import { IsValidScopeValue } from '~/claims/decorators/validation';

export class ScopeDto {
  @ApiProperty({
    description:
      'The type of Scope. If `Identity` then `value` should be a DID. If `Ticker` then `value` should be a Ticker',
    enum: ScopeType,
    example: ScopeType.Identity,
  })
  @IsEnum(ScopeType)
  type: ScopeType;

  @ApiProperty({
    description:
      'The value of the Scope. This is a hex prefixed 64 character string for `Identity`, 12 uppercase letters for Ticker',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @IsValidScopeValue('type')
  value: string;
}
