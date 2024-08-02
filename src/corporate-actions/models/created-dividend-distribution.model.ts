/* istanbul ignore file */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { DividendDistributionModel } from '~/corporate-actions/models/dividend-distribution.model';

export class CreatedDividendDistributionModel extends TransactionQueueModel {
  @ApiPropertyOptional({
    description: 'Static data (and identifiers) of the newly created Dividend Distribution',
    type: DividendDistributionModel,
  })
  @Type(() => DividendDistributionModel)
  readonly dividendDistribution: DividendDistributionModel;

  constructor(model: CreatedDividendDistributionModel) {
    const { transactions, details, ...rest } = model;
    super({ transactions, details });

    Object.assign(this, rest);
  }
}
