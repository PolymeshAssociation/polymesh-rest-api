/* istanbul ignore file */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Venue } from '@polymeshassociation/polymesh-sdk/types';

import { FromEntity } from '~/common/decorators/transformation';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';

export class CreatedVenueModel extends TransactionQueueModel {
  @ApiPropertyOptional({
    type: 'string',
    description: 'ID of the newly created Venue',
    example: '123',
  })
  @FromEntity()
  readonly venue: Venue;

  constructor(model: CreatedVenueModel) {
    const { transactions, details, ...rest } = model;
    super({ transactions, details });

    Object.assign(this, rest);
  }
}
