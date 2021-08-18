import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { DividendDistribution } from '@polymathnetwork/polymesh-sdk/types';

import { FromBigNumber, FromEntity } from '~/common/decorators/transformation';

export class DistributionWithDetailsModel {
  @ApiProperty({
    description: 'Details of the Dividend Distribution',
  })
  @FromEntity()
  distribution: DividendDistribution;

  @ApiProperty({
    description: 'Number of remaining funds',
    type: 'string',
    example: '1000',
  })
  @FromBigNumber()
  remainingFunds: BigNumber;

  @ApiProperty({
    description:
      'Indicates whether the unclaimed funds have been reclaimed by the Corporate Actions Agent',
    type: 'boolean',
    example: false,
  })
  fundsReclaimed: boolean;

  constructor(model: DistributionWithDetailsModel) {
    Object.assign(this, model);
  }
}
