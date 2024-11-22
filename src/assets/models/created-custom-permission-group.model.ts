/* istanbul ignore file */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from 'bignumber.js';

import { TransactionQueueModel } from '~/common/models/transaction-queue.model';

export class CreatedCustomPermissionGroupModel extends TransactionQueueModel {
  @ApiPropertyOptional({
    description: 'The newly created ID',
    example: '1',
  })
  readonly id: BigNumber;

  constructor(model: CreatedCustomPermissionGroupModel) {
    const { transactions, details, ...rest } = model;
    super({ transactions, details });

    Object.assign(this, rest);
  }
}
