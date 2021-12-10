/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { PortfolioIdentifierModel } from '~/portfolios/models/portfolio-identifier.model';

export class CreatedPortfolioModel extends TransactionQueueModel {
  @ApiProperty({
    description: 'Details of the newly created Portfolio',
    type: PortfolioIdentifierModel,
  })
  @Type(() => PortfolioIdentifierModel)
  readonly portfolio: PortfolioIdentifierModel;

  constructor(model: CreatedPortfolioModel) {
    const { transactions, ...rest } = model;
    super({ transactions });

    Object.assign(this, rest);
  }
}
