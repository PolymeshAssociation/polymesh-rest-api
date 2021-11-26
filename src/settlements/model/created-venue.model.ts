/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Venue } from '@polymathnetwork/polymesh-sdk/types';

import { FromEntity } from '~/common/decorators/transformation';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';

export class CreatedVenueModel extends TransactionQueueModel {
  @ApiProperty({
    type: 'string',
    description: 'ID of the newly created Venue',
    example: '123',
  })
  @FromEntity()
  readonly venue: Venue;

  constructor(model: CreatedVenueModel) {
    const { transactions, ...rest } = model;
    super({ transactions });

    Object.assign(this, rest);
  }
}
