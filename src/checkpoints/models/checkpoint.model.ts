/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Checkpoint } from '@polymathnetwork/polymesh-sdk/internal';

import { FromEntity } from '~/common/decorators/transformation';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';

export class CheckpointModel extends TransactionQueueModel {
  @ApiProperty({
    description: 'Details of the newly created Checkpoint',
    example: {
      id: '1',
      ticker: 'TICKER',
    },
  })
  @FromEntity()
  readonly checkpoint: Checkpoint;

  constructor(model: CheckpointModel) {
    const { transactions, ...rest } = model;
    super({ transactions });

    Object.assign(this, rest);
  }
}
