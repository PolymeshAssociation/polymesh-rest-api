/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { FungibleAsset } from '@polymeshassociation/polymesh-sdk/types';

import { BalanceModel } from '~/assets/models/balance.model';
import { FromEntity } from '~/common/decorators/transformation';

export class AssetBalanceModel extends BalanceModel {
  @ApiProperty({
    description: 'Ticker of the Asset',
    type: 'string',
    example: 'TICKER',
  })
  @FromEntity()
  readonly asset: FungibleAsset;

  constructor(model: AssetBalanceModel) {
    const { asset, ...balance } = model;
    super(balance);
    this.asset = asset;
  }
}
