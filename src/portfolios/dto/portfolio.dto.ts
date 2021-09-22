/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { PortfolioLike } from '@polymathnetwork/polymesh-sdk/types';
import { IsOptional } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber, IsDid } from '~/common/decorators/validation';
import { toPortfolioId } from '~/portfolios/portfolios.util';

export class PortfolioDto {
  @ApiProperty({
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @IsDid()
  readonly did: string;

  @ApiPropertyOptional({
    example: '123',
    description: 'Portfolio number, do not send any value for the Default Portfolio',
  })
  @IsOptional()
  @IsBigNumber()
  @ToBigNumber()
  readonly id?: BigNumber;

  public toPortfolioLike(): PortfolioLike {
    const { did, id } = this;
    const portfolioId = toPortfolioId(id);

    if (portfolioId) {
      return {
        identity: did,
        id: portfolioId,
      };
    }

    return did;
  }

  constructor(dto: Omit<PortfolioDto, 'toPortfolioLike'>) {
    Object.assign(this, dto);
  }
}
