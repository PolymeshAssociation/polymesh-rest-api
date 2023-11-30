/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Type } from 'class-transformer';
import { ValidateIf, ValidateNested } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber, IsTicker } from '~/common/decorators/validation';
import { PortfolioDto } from '~/portfolios/dto/portfolio.dto';

export class LegDto {
  @ApiPropertyOptional({
    description: 'Amount of the fungible Asset to be transferred',
    type: 'string',
    example: '1000',
  })
  @ValidateIf(({ nfts }) => !nfts)
  @IsBigNumber()
  @ToBigNumber()
  readonly amount?: BigNumber;

  @ApiPropertyOptional({
    description: 'The NFT IDs of a collection to be transferred',
    type: 'string',
    example: ['1'],
  })
  @ValidateIf(({ amount }) => !amount)
  @IsBigNumber()
  @ToBigNumber()
  readonly nfts?: BigNumber[];

  @ApiProperty({
    description: 'Portfolio of the sender',
    type: () => PortfolioDto,
    example: {
      did: '0x0600000000000000000000000000000000000000000000000000000000000000',
      id: 1,
    },
  })
  @ValidateNested()
  @Type(() => PortfolioDto)
  readonly from: PortfolioDto;

  @ApiProperty({
    description: 'Portfolio of the receiver',
    type: () => PortfolioDto,
    example: {
      did: '0x0111111111111111111111111111111111111111111111111111111111111111',
      id: 0,
    },
  })
  @ValidateNested()
  @Type(() => PortfolioDto)
  readonly to: PortfolioDto;

  @ApiProperty({
    description: 'Asset ticker',
    example: 'TICKER',
  })
  @IsTicker()
  readonly asset: string;
}
