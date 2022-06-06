/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { Identity } from '@polymathnetwork/polymesh-sdk/types';
import { Type } from 'class-transformer';

import { AssetBalanceModel } from '~/assets/models/asset-balance.model';
import { FromEntity } from '~/common/decorators/transformation';
import { FromPortfolioId } from '~/portfolios/decorators/transformation';

export class PortfolioModel {
  @ApiProperty({
    description: 'Portfolio number. 0 represents the Default Portfolio',
    type: 'string',
    example: '123',
  })
  @FromPortfolioId()
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

  @ApiPropertyOptional({
    description: 'Identity who custodies the Portfolio',
    type: 'string',
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
