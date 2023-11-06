/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { IsByteLength, IsOptional, IsString, ValidateIf } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber, IsTicker } from '~/common/decorators/validation';

export class PortfolioMovementDto {
  @ApiProperty({
    description: 'Ticker of Asset to move',
    example: 'TICKER',
  })
  @IsTicker()
  readonly ticker: string;

  @ApiPropertyOptional({
    description: 'Amount of a Fungible Asset to move',
    example: '1234',
    type: 'string',
  })
  @ValidateIf(({ nfts }) => !nfts)
  @IsBigNumber()
  @ToBigNumber()
  readonly amount?: BigNumber;

  @ApiPropertyOptional({
    description: 'NFT IDs to move from a collection',
    example: ['1'],
    isArray: true,
  })
  @ValidateIf(({ amount }) => !amount)
  @IsBigNumber()
  @ToBigNumber()
  readonly nfts?: BigNumber[];

  @ApiPropertyOptional({
    description: 'Memo to help identify the transfer. Maximum 32 bytes',
    example: 'Transfer to growth portfolio',
  })
  @IsOptional()
  @IsString()
  @IsByteLength(0, 32)
  readonly memo?: string;
}
