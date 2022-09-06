/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';
import { TransactionBaseDto } from '~/common/dto/signer.dto';
import { PortfolioDto } from '~/portfolios/dto/portfolio.dto';

export class ControllerTransferDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'Portfolio from which Asset tokens will be transferred',
    type: () => PortfolioDto,
  })
  @ValidateNested()
  @Type(() => PortfolioDto)
  origin: PortfolioDto;

  @ApiProperty({
    description: 'The amount of the Asset tokens to be transferred',
    example: '1000',
    type: 'string',
  })
  @ToBigNumber()
  @IsBigNumber()
  readonly amount: BigNumber;
}
