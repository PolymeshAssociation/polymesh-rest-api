/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { FungibleAsset, NftCollection } from '@polymeshassociation/polymesh-sdk/types';
import { Type } from 'class-transformer';

import { FromBigNumber, FromEntity } from '~/common/decorators/transformation';
import { PortfolioIdentifierModel } from '~/portfolios/models/portfolio-identifier.model';

export class LegModel {
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
    description: 'Asset to be transferred',
    type: 'string',
    example: 'TICKER',
  })
  @FromEntity()
  readonly asset: FungibleAsset | NftCollection;

  constructor(model: LegModel) {
    Object.assign(this, model);
  }
}
