/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { FungibleAsset } from '@polymeshassociation/polymesh-sdk/types';

import { BalanceModel } from '~/assets/models/balance.model';
import { FromEntity } from '~/common/decorators/transformation';

export class AssetBalanceModel extends BalanceModel {
  @ApiProperty({
    description: 'The Asset ID',
    type: 'string',
    example: '6468aa16-7b77-8fcd-9605-da785c4005a8',
  })
  @FromEntity()
  readonly asset: FungibleAsset;

  constructor(model: AssetBalanceModel) {
    const { asset, ...balance } = model;
    super(balance);
    this.asset = asset;
  }
}
