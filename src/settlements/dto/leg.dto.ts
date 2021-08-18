/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber, IsTicker } from '~/common/decorators/validation';
import { PortfolioDto } from '~/portfolios/dto/portfolio.dto';

export class LegDto {
  @ApiProperty({
    description: 'Amount of the Asset to be transferred',
    type: 'string',
    example: '1000',
  })
  @IsBigNumber()
  @ToBigNumber()
  readonly amount: BigNumber;

  @ApiProperty({
    description: 'Portfolio of the sender',
    type: () => PortfolioDto,
  })
  @ValidateNested()
  @Type(() => PortfolioDto)
  readonly from: PortfolioDto;

  @ApiProperty({
    description: 'Portfolio of the receiver',
    type: () => PortfolioDto,
  })
  @ValidateNested()
  @Type(() => PortfolioDto)
  readonly to: PortfolioDto;

  @ApiProperty({
    description: 'Asset ticker',
    example: 'MY_TOKEN',
  })
  @IsTicker()
  readonly asset: string;
}
