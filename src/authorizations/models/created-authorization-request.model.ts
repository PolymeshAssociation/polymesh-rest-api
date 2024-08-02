/* istanbul ignore file */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { AuthorizationRequestModel } from '~/authorizations/models/authorization-request.model';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';

export class CreatedAuthorizationRequestModel extends TransactionQueueModel {
  @ApiPropertyOptional({
    description: 'Details of the newly created Authorization Request',
    type: AuthorizationRequestModel,
  })
  @Type(() => AuthorizationRequestModel)
  readonly authorizationRequest: AuthorizationRequestModel;

  constructor(model: CreatedAuthorizationRequestModel) {
    const { transactions, details, ...rest } = model;
    super({ transactions, details });

    Object.assign(this, rest);
  }
}
