/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { Identity } from '@polymathnetwork/polymesh-sdk/types';
import { Type } from 'class-transformer';

import { FromBigNumber, FromEntity } from '~/common/decorators/transformation';
import { TokenBalanceModel } from '~/tokens/models/token-balance.model';

export class PortfolioModel {
  @ApiProperty({
    description: 'Portfolio number. An empty value represents the Default Portfolio',
    type: 'string',
    nullable: true,
    example: '123',
  })
  @FromBigNumber()
  readonly id?: BigNumber;

  @ApiProperty({
    description: 'Name of the Portfolio',
    type: 'string',
    example: 'ABC',
    nullable: true,
  })
  readonly name: string;

  @ApiProperty({
    description: 'List of balances for each token in the Portfolio',
    type: () => TokenBalanceModel,
    isArray: true,
  })
  @Type(() => TokenBalanceModel)
  readonly tokenBalances: TokenBalanceModel[];

  @ApiProperty({
    description: 'Identity who custodies the Portfolio',
    type: 'string',
    nullable: true,
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @FromEntity()
  readonly custodian?: Identity;

  @ApiProperty({
    description: 'Identity who owns the Portfolio',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @FromEntity()
  readonly owner: Identity;

  constructor(model: Partial<PortfolioModel>) {
    Object.assign(this, model);
  }
}
