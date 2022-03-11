/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { AuthorizationRequestModel } from '~/authorizations/models/authorization-request.model';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';

export class GeneratedAuthorizationRequestModel extends TransactionQueueModel {
  @ApiProperty({
    description: 'Details of the newly generated Authorization request',
    type: AuthorizationRequestModel,
  })
  @Type(() => AuthorizationRequestModel)
  readonly authorizationRequest: AuthorizationRequestModel;

  constructor(model: GeneratedAuthorizationRequestModel) {
    const { transactions, ...rest } = model;
    super({ transactions });

    Object.assign(this, rest);
  }
}
