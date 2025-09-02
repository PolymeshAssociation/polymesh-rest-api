/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { CountryCode } from '@polymeshassociation/polymesh-sdk/types';
import { IsEnum, IsOptional } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';

export class ClaimCountJurisdictionValueItemDto {
  @ApiPropertyOptional({ description: 'Country code for the jurisdiction', enum: CountryCode })
  @IsOptional()
  @IsEnum(CountryCode)
  readonly countryCode?: CountryCode;

  @ApiProperty({
    description: 'Investor count for the jurisdiction',
    type: 'string',
    example: '25',
  })
  @ToBigNumber()
  @IsBigNumber()
  readonly count: BigNumber;
}
