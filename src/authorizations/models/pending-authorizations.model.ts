/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { AuthorizationRequestModel } from '~/authorizations/models/authorization-request.model';

export class PendingAuthorizationsModel {
  @ApiProperty({
    description: 'List of pending Authorization Requests targeting the specified Identity',
    type: AuthorizationRequestModel,
  })
  @Type(() => AuthorizationRequestModel)
  readonly received: AuthorizationRequestModel[];

  @ApiProperty({
    description: 'List of pending Authorization Requests issued by the specified Identity',
    type: AuthorizationRequestModel,
  })
  @Type(() => AuthorizationRequestModel)
  readonly sent: AuthorizationRequestModel[];

  constructor(model: PendingAuthorizationsModel) {
    Object.assign(this, model);
  }
}
