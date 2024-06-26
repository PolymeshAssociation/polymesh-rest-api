/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Type } from 'class-transformer';

import { FromBigNumber } from '~/common/decorators/transformation';
import { LegType } from '~/common/types';
import { PortfolioIdentifierModel } from '~/portfolios/models/portfolio-identifier.model';
import { AssetLegModel } from '~/settlements/models/asset-leg.model';

export class LegModel extends AssetLegModel {
  @ApiProperty({
    description: 'Portfolio from which the transfer is to be made',
    type: PortfolioIdentifierModel,
  })
  @Type(() => PortfolioIdentifierModel)
  readonly from: PortfolioIdentifierModel;

  @ApiProperty({
    description: 'Portfolio to which the transfer is to be made',
    type: PortfolioIdentifierModel,
  })
  @Type(() => PortfolioIdentifierModel)
  readonly to: PortfolioIdentifierModel;

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
