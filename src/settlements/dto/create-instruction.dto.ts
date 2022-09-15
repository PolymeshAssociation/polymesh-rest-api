/* istanbul ignore file */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, ValidateNested } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { LegDto } from '~/settlements/dto/leg.dto';

export class CreateInstructionDto extends TransactionBaseDto {
  @ValidateNested({ each: true })
  @Type(() => LegDto)
  readonly legs: LegDto[];

  @ApiPropertyOptional({
    description: 'Date at which the trade was agreed upon (optional, for offchain trades)',
    example: new Date('10/14/1987').toISOString(),
  })
  @IsOptional()
  @IsDate()
  readonly tradeDate?: Date;

  @ApiPropertyOptional({
    description: 'Date at which the trade was executed (optional, for offchain trades)',
    example: new Date('10/14/1987').toISOString(),
  })
  @IsOptional()
  @IsDate()
  readonly valueDate?: Date;

  @ApiPropertyOptional({
    type: 'string',
    description:
      'Block at which the Instruction will be executed. If not passed, the Instruction will be executed when all parties affirm or as soon as one party rejects',
    example: '123',
  })
  @IsOptional()
  @IsBigNumber()
  @ToBigNumber()
  readonly endBlock?: BigNumber;
}
