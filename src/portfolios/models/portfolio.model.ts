/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { Identity } from '@polymathnetwork/polymesh-sdk/types';
import { Type } from 'class-transformer';

import { AssetBalanceModel } from '~/assets/models/asset-balance.model';
import { FromBigNumber, FromEntity } from '~/common/decorators/transformation';

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
  })
  readonly name: string;

  @ApiProperty({
    description: 'List of balances for each Asset in the Portfolio',
    type: () => AssetBalanceModel,
    isArray: true,
  })
  @Type(() => AssetBalanceModel)
  readonly assetBalances: AssetBalanceModel[];

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

  constructor(model: PortfolioModel) {
    Object.assign(this, model);
  }
}
