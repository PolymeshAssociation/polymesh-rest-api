/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { PortfolioLike } from '@polymathnetwork/polymesh-sdk/types';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsDid, IsNumber } from '~/common/decorators/validation';
import { toPortfolioId } from '~/portfolios/portfolios.util';

export class PortfolioDto {
  @ApiProperty({
    description: 'The DID of the Portfolio owner',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @IsDid()
  readonly did: string;

  @ApiProperty({
    description: 'Portfolio number. Use 0 for the Default Portfolio',
    example: '123',
  })
  @IsNumber()
  @ToBigNumber()
  readonly id: BigNumber;

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
