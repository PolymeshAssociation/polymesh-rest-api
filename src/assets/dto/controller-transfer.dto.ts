/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';
import { SignerDto } from '~/common/dto/signer.dto';
import { PortfolioDto } from '~/portfolios/dto/portfolio.dto';

export class ControllerTransferDto extends SignerDto {
  @ApiProperty({
    description: 'Portfolio from which Asset tokens will be transferred',
    type: () => PortfolioDto,
    example: {
      did: '0x0600000000000000000000000000000000000000000000000000000000000000',
      id: 1,
    },
  })
  @ValidateNested()
  @Type(() => PortfolioDto)
  origin: PortfolioDto;

  @ApiProperty({
    description: 'The amount of the Asset tokens to be transferred',
    example: '1000',
    type: BigNumber,
  })
  @ToBigNumber()
  @IsBigNumber()
  readonly amount: BigNumber;
}
