/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { PortfolioLike } from '@polymathnetwork/polymesh-sdk/types';
import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsNumberString, IsOptional, ValidateNested } from 'class-validator';

import { ToBigNumber, ToPortfolioLike } from '~/common/decorators/transformation';
import { IsTicker } from '~/common/decorators/validation';
import { PortfolioDto } from '~/common/dto/portfolio.dto';
import { SignerDto } from '~/common/dto/signer.dto';

class LegDto {
  @ApiProperty({
    type: 'string',
    example: '1000',
    description: 'Amount of the Asset to be transferred',
  })
  @IsNumberString()
  @ToBigNumber()
  readonly amount: BigNumber;

  @ApiProperty({
    type: () => PortfolioDto,
  })
  @ValidateNested()
  @Type(() => PortfolioDto)
  @ToPortfolioLike()
  readonly from: PortfolioLike;

  @ApiProperty({
    type: () => PortfolioDto,
  })
  @ValidateNested()
  @Type(() => PortfolioDto)
  @ToPortfolioLike()
  readonly to: PortfolioLike;

  @ApiProperty({
    description: 'Security Token ticker',
    example: 'MY_TOKEN',
  })
  @IsTicker()
  readonly token: string;
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
  @IsNumber()
  @ToBigNumber()
  readonly endBlock?: BigNumber;
}
