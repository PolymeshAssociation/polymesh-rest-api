/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { IsByteLength, IsOptional, IsString } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber, IsTicker } from '~/common/decorators/validation';

export class PortfolioMovementDto {
  @ApiProperty({
    description: 'Ticker of Asset to move',
    example: 'TICKER',
  })
  @IsTicker()
  readonly ticker: string;

  @ApiProperty({
    description: 'Amount of the Asset to move',
    example: '1234',
    type: 'string',
  })
  @IsBigNumber()
  @ToBigNumber()
  readonly amount: BigNumber;

  @ApiPropertyOptional({
    description: 'Memo to help identify the transfer. Maximum 32 bytes',
    example: 'Transfer to growth portfolio',
  })
  @IsOptional()
  @IsString()
  @IsByteLength(0, 32)
  readonly memo?: string;
}
