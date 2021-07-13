/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { ClaimsModel } from '~/claims/model/claims.model';
import { IdentityModel } from '~/identities/models/identity.model';

export class ClaimsIdentityModel {
  @ApiProperty({
    description: 'Target identity details',
    type: IdentityModel,
  })
  identity: IdentityModel;

  @ApiProperty({
    description: 'List of claims associated with the identity',
    isArray: true,
    type: ClaimsModel,
  })
  claims: ClaimsModel[];
}
