/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, ValidateNested } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber, IsTicker } from '~/common/decorators/validation';
import { SignerDto } from '~/common/dto/signer.dto';
import { PortfolioDto } from '~/portfolios/dto/portfolio.dto';

class LegDto {
  @ApiProperty({
    type: 'string',
    example: '1000',
    description: 'Amount of the Asset to be transferred',
  })
  @IsBigNumber()
  @ToBigNumber()
  readonly amount: BigNumber;

  @ApiProperty({
    type: () => PortfolioDto,
  })
  @ValidateNested()
  @Type(() => PortfolioDto)
  readonly from: PortfolioDto;

  @ApiProperty({
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

export class CreateInstructionDto extends SignerDto {
  @ValidateNested({ each: true })
  @Type(() => LegDto)
  readonly legs: LegDto[];

  @ApiProperty({
    description: 'Date at which the trade was agreed upon (optional, for offchain trades)',
    example: new Date('10/14/1987').toISOString(),
    nullable: true,
  })
  @IsOptional()
  @IsDate()
  readonly tradeDate?: Date;

  @ApiProperty({
    description: 'Date at which the trade was executed (optional, for offchain trades)',
    example: new Date('10/14/1987').toISOString(),
    nullable: true,
  })
  @IsOptional()
  @IsDate()
  readonly valueDate?: Date;

  @ApiProperty({
    type: 'string',
    description:
      'Block at which the Instruction will be executed. If not passed, the Instruction will be executed when all parties affirm or as soon as one party rejects',
    example: '123',
    nullable: true,
  })
  @IsOptional()
  @IsBigNumber()
  @ToBigNumber()
  readonly endBlock?: BigNumber;
}
