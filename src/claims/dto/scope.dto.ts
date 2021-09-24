/* istanbul ignore file */

import { Scope } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { ScopeType } from '@polymathnetwork/polymesh-sdk/types';
import { IsEnum } from 'class-validator';

import { IsValidScopeValue } from '~/common/decorators/validation';

// No Custom scope types for now
// export const { Custom, ...DefinedScopeTypeEnum } = ScopeType;
// type excludedOptions = typeof ScopeType.Custom;
// type DefinedScopeType = Exclude<typeof DefinedScopeTypeEnum, excludedOptions>;

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
      'The value of the Scope. This is a hex prefixed 64 charcter string for `Identity`, 12 uppercase letters for Ticker',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @IsValidScopeValue('type')
  value: string;
}
