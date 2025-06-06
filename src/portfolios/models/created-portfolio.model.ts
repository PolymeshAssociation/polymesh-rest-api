/* istanbul ignore file */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { PortfolioIdentifierModel } from '~/portfolios/models/portfolio-identifier.model';

export class CreatedPortfolioModel extends TransactionQueueModel {
  @ApiPropertyOptional({
    description: 'Details of the newly created Portfolio',
    type: PortfolioIdentifierModel,
  })
  @Type(() => PortfolioIdentifierModel)
  readonly portfolio: PortfolioIdentifierModel;

  constructor(model: CreatedPortfolioModel) {
    const { transactions, details, ...rest } = model;
    super({ transactions, details });

    Object.assign(this, rest);
  }
}
