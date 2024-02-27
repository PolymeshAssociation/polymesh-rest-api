/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { IsBoolean, IsOptional } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class SetConfidentialVenueFilteringParamsDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'Indicator to enable/disable when filtering',
    type: 'boolean',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  readonly enabled?: boolean;

  @ApiProperty({
    description:
      'List of additional confidential Venues allowed to create confidential Transactions for a specific Confidential Asset',
    isArray: true,
    type: 'string',
    example: ['1', '2'],
  })
  @IsOptional()
  @ToBigNumber()
  @IsBigNumber()
  readonly allowedVenues?: BigNumber[];

  @ApiProperty({
    description:
      'List of additional confidential Venues to be removed from the existing `allowedVenues` list',
    isArray: true,
    type: 'string',
    example: ['1', '2'],
  })
  @IsOptional()
  @ToBigNumber()
  @IsBigNumber()
  readonly disallowedVenues?: BigNumber[];
}
