/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators/transformation';
import { DividendDistributionModel } from '~/corporate-actions/model/dividend-distribution.model';

export class DividendDistributionDetailsModel extends DividendDistributionModel {
  @ApiProperty({
    description: 'Amount of remaining funds',
    type: 'string',
    example: '1000',
  })
  @FromBigNumber()
  readonly remainingFunds: BigNumber;

  @ApiProperty({
    description: 'Indicates whether the unclaimed funds have been reclaimed by an Agent',
    type: 'boolean',
    example: false,
  })
  readonly fundsReclaimed: boolean;

  constructor(model: DividendDistributionDetailsModel) {
    const { remainingFunds, fundsReclaimed, ...dividendDistribution } = model;
    super(dividendDistribution);
    this.remainingFunds = remainingFunds;
    this.fundsReclaimed = fundsReclaimed;
  }
}
