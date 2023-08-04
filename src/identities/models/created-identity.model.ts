/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { IdentityModel } from '~/identities/models/identity.model';

export class CreatedIdentityModel extends TransactionQueueModel {
  @ApiProperty({
    description: 'Static data (and identifiers) of the newly created Identity',
    type: IdentityModel,
  })
  @Type(() => IdentityModel)
  readonly identity: IdentityModel;

  constructor(model: CreatedIdentityModel) {
    const { transactions, details, ...rest } = model;
    super({ transactions, details });

    Object.assign(this, rest);
  }
}
