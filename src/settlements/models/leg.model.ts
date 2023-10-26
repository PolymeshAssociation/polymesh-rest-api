/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { FungibleAsset } from '@polymeshassociation/polymesh-sdk/types';
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

  @ApiProperty({
    description: 'Amount to be transferred',
    type: 'string',
    example: '123',
  })
  @FromBigNumber()
  readonly amount: BigNumber;

  @ApiProperty({
    description: 'Asset to be transferred',
    type: 'string',
    example: 'TICKER',
  })
  @FromEntity()
  readonly asset: FungibleAsset;

  constructor(model: LegModel) {
    Object.assign(this, model);
  }
}
