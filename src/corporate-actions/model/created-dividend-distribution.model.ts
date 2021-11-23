/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { DividendDistributionModel } from '~/corporate-actions/model/dividend-distribution.model';

export class CreatedDividendDistributionModel extends TransactionQueueModel {
  @ApiProperty({
    description: 'Static data (and identifiers) of the newly created Dividend Distribution',
    type: DividendDistributionModel,
  })
  @Type(() => DividendDistributionModel)
  readonly dividendDistribution: DividendDistributionModel;

  constructor(model: CreatedDividendDistributionModel) {
    const { transactions, ...rest } = model;
    super({ transactions });

    Object.assign(this, rest);
  }
}
