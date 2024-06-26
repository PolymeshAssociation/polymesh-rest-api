/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Identity } from '@polymeshassociation/polymesh-sdk/types';

import { FromBigNumber, FromEntity } from '~/common/decorators/transformation';
import { LegType } from '~/common/types';
import { AssetLegModel } from '~/settlements/models/asset-leg.model';

export class OffChainLegModel extends AssetLegModel {
  @ApiProperty({
    description: 'DID of the sender',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @FromEntity()
  readonly from: Identity;

  @ApiProperty({
    description: 'DID of the sender',
    type: 'string',
    example: '0x0111111111111111111111111111111111111111111111111111111111111111',
  })
  @FromEntity()
  readonly to: Identity;

  @ApiPropertyOptional({
    description: 'Amount of off chain tokens being transferred',
    type: 'string',
    example: '123',
  })
  @FromBigNumber()
  readonly offChainAmount: BigNumber;

  @ApiProperty({
    description: 'Indicates that the leg is off chain',
    enum: LegType,
    type: 'string',
    example: LegType.offChain,
  })
  readonly type = LegType.offChain;

  constructor(model: OffChainLegModel) {
    const { asset, type, ...rest } = model;
    super({ asset, type });
    Object.assign(this, rest);
  }
}
