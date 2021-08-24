/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { Type } from 'class-transformer';

import { FromBigNumber } from '~/common/decorators/transformation';
import { CorporateActionModel } from '~/corporate-actions/model/corporate-action.model';
import { PortfolioIdentifierModel } from '~/portfolios/models/portfolio-identifier.model';

export class DividendDistributionModel extends CorporateActionModel {
  @ApiProperty({
    description: 'Portfolio from which the Dividends are distributed',
    type: PortfolioIdentifierModel,
  })
  @Type(() => PortfolioIdentifierModel)
  readonly origin: PortfolioIdentifierModel;

  @ApiProperty({
    description: 'Ticker of the currency in which Dividends are distributed',
    type: 'string',
    example: 'TICKER',
  })
  readonly currency: string;

  @ApiProperty({
    description: "Amount of `currency` to pay for each Asset holders' share",
    type: 'string',
    example: '100',
  })
  @FromBigNumber()
  readonly perShare: BigNumber;

  @ApiProperty({
    description: 'Maximum amount of `currency` to be distributed',
    type: 'string',
    example: '1000',
  })
  @FromBigNumber()
  readonly maxAmount: BigNumber;

  @ApiProperty({
    description:
      'Date after which Dividends can no longer be paid/reclaimed. A null value means the Distribution never expires',
    type: 'string',
    example: new Date('10/14/1987').toISOString(),
    nullable: true,
  })
  readonly expiryDate: null | Date;

  @ApiProperty({
    description: 'Date starting from which dividends can be paid/reclaimed',
    type: 'string',
    example: new Date('10/14/1987').toISOString(),
  })
  readonly paymentDate: Date;

  @ApiProperty({
    description: 'Amount of remaining funds',
    type: 'string',
    example: '1000',
  })
  @FromBigNumber()
  readonly remainingFunds: BigNumber;

  @ApiProperty({
    description:
      'Indicates whether the unclaimed funds have been reclaimed by the Corporate Actions Agent',
    type: 'boolean',
    example: false,
  })
  readonly fundsReclaimed: boolean;

  constructor(model: DividendDistributionModel) {
    const {
      id,
      ticker,
      declarationDate,
      description,
      targets,
      taxWithholdings,
      defaultTaxWithholding,
      ...rest
    } = model;

    super({
      id,
      ticker,
      declarationDate,
      description,
      targets,
      taxWithholdings,
      defaultTaxWithholding,
    });

    Object.assign(this, rest);
  }
}
