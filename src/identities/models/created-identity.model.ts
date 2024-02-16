/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { IdentityDetailsModel } from '~/identities/models/identity-details.model';

export class CreatedIdentityModel extends TransactionQueueModel {
  @ApiProperty({
    description: 'Static data (and identifiers) of the newly created Identity',
    type: IdentityDetailsModel,
  })
  @Type(() => IdentityDetailsModel)
  readonly identity: IdentityDetailsModel;

  constructor(model: CreatedIdentityModel) {
    const { transactions, details, ...rest } = model;
    super({ transactions, details });

    Object.assign(this, rest);
  }
}
