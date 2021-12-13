/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { Type } from 'class-transformer';

import { FromBigNumber } from '~/common/decorators/transformation';
import { DividendDistributionModel } from '~/corporate-actions/model/dividend-distribution.model';

export class DividendDistributionDetailsModel {
  @ApiProperty({
    description:
      'Corporate Action where an Asset issuer distributes dividends between a subset of Asset holders (`targets`)',
    type: DividendDistributionModel,
  })
  @Type(() => DividendDistributionModel)
  readonly distribution: DividendDistributionModel;

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

  constructor(model: DividendDistributionDetailsModel) {
    Object.assign(this, model);
  }
}
