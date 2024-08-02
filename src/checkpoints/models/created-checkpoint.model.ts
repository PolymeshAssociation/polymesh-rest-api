/* istanbul ignore file */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Checkpoint } from '@polymeshassociation/polymesh-sdk/types';

import { FromEntity } from '~/common/decorators/transformation';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';

export class CreatedCheckpointModel extends TransactionQueueModel {
  @ApiPropertyOptional({
    description: 'Identifiers of the newly created Checkpoint',
    example: {
      id: '1',
      ticker: 'TICKER',
    },
  })
  @FromEntity()
  readonly checkpoint: Checkpoint;

  constructor(model: CreatedCheckpointModel) {
    const { transactions, details, ...rest } = model;
    super({ transactions, details });

    Object.assign(this, rest);
  }
}
