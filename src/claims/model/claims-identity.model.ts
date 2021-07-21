import { IdentityModel } from '~/identities/models/identity.model';
/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Identity } from '@polymathnetwork/polymesh-sdk/internal';
import { ClaimModel } from '~/claims/model/claim.model';
import { FromEntity } from '~/common/decorators/transformation';

export class ClaimsIdentityModel {
  @ApiProperty({
    description: 'DID of the target Identity',
    type: 'string',
  })
  readonly identity: IdentityModel;

  @ApiProperty({
    description: 'List of Claims associated with the Identity',
    isArray: true,
    type: ClaimModel,
  })
  readonly claims?: ClaimModel[];

  constructor(model: ClaimsIdentityModel) {
    Object.assign(this, model);
  }
}
