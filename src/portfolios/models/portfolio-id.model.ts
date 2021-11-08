/* istanbul ignore file */
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { TransactionQueueModel } from '~/common/models/transaction-queue.model';

import { PortfolioIdentifierModel } from './portfolio-identifier.model';

export class PortfolioIdModel extends TransactionQueueModel {
  @ApiProperty({
    description: 'Details of the newly created Portfolio',
    type: PortfolioIdentifierModel,
  })
  @Type(() => PortfolioIdentifierModel)
  readonly portfolioId: PortfolioIdentifierModel;

  constructor(model: PortfolioIdModel) {
    const { transactions, ...rest } = model;
    super({ transactions });

    Object.assign(this, rest);
  }
}
