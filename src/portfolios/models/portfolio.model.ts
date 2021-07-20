/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { Identity } from '@polymathnetwork/polymesh-sdk/types';
import { IsOptional } from 'class-validator';

import { FromBigNumber, FromEntity } from '~/common/decorators/transformation';
import { TokenBalanceModel } from '~/tokens/models/token-balance.model';

export class PortfolioModel {
  @ApiProperty({
    nullable: true,
    example: '123',
    description: 'Portfolio number. An empty value represents the Default Portfolio',
  })
  @FromBigNumber()
  @IsOptional()
  readonly id?: BigNumber;

  @ApiProperty({
    example: 'ABC',
    description: 'Name of the Portfolio',
  })
  @IsOptional()
  readonly name?: string;

  @ApiProperty({
    description: 'List of balances for each token in the Portfolio',
    type: TokenBalanceModel,
  })
  readonly tokenBalances: TokenBalanceModel[];

  @ApiProperty({
    description: 'Identity who custodies the Portfolio',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
    nullable: true,
  })
  @FromEntity()
  @IsOptional()
  readonly custodian?: Identity;

  @ApiProperty({
    description: 'Identity who owns the Portfolio',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @FromEntity()
  @IsOptional()
  readonly owner?: Identity;

  constructor(model?: PortfolioModel) {
    Object.assign(this, model);
  }
}
