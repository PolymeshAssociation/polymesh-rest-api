/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Type } from 'class-transformer';

import { FromBigNumber } from '~/common/decorators/transformation';
import { AssetHolderModel } from '~/common/models/asset-holder.model';
import { LegType } from '~/common/types';
import { AssetLegModel } from '~/settlements/models/asset-leg.model';

export class LegModel extends AssetLegModel {
  @ApiProperty({
    description: 'Asset holder from which the transfer is to be made',
    type: AssetHolderModel,
  })
  @Type(() => AssetHolderModel)
  readonly from: AssetHolderModel;

  @ApiProperty({
    description: 'Asset holder to which the transfer is to be made',
    type: AssetHolderModel,
  })
  @Type(() => AssetHolderModel)
  readonly to: AssetHolderModel;

  @ApiPropertyOptional({
    description: 'Amount of fungible tokens to be transferred',
    type: 'string',
    example: '123',
  })
  @FromBigNumber()
  readonly amount?: BigNumber;

  @ApiPropertyOptional({
    description: 'The NFTs from the collection to be transferred',
    type: 'string',
    example: '123',
  })
  @FromBigNumber()
  readonly nfts?: BigNumber[];

  @ApiProperty({
    description: 'Indicates that the leg is on chain',
    enum: LegType,
    type: 'string',
    example: LegType.onChain,
  })
  readonly type = LegType.onChain;

  constructor(model: LegModel) {
    const { asset, type, ...rest } = model;
    super({ asset, type });
    Object.assign(this, rest);
  }
}
