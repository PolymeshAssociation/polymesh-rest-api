/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { TransactionQueueModel } from '~/common/models/transaction-queue.model';

export class MultiSigCreatedModel extends TransactionQueueModel {
  @ApiProperty({
    description: 'The address of the multiSig',
    type: 'string',
    example: '5HCKs1tNprs5S1pHHmsHXaQacSQbYDhLUCyoMZiM7KT8JkNb',
  })
  readonly multiSigAddress: string;

  constructor(model: MultiSigCreatedModel) {
    const { transactions, details, ...rest } = model;

    super({ transactions, details });

    Object.assign(this, rest);
  }
}
