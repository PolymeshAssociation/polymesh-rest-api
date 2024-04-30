/* istanbul ignore file */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { MultiSigDetailsModel } from '~/accounts/models/multi-sig-details.model';
import { IdentityModel } from '~/identities/models/identity.model';

export class AccountDetailsModel {
  @ApiPropertyOptional({
    description: 'Static data (and identifiers) of the newly created Identity',
    type: IdentityModel,
  })
  @Type(() => IdentityModel)
  readonly identity?: IdentityModel;

  @ApiPropertyOptional({
    description: 'MultiSig Account details',
    type: MultiSigDetailsModel,
  })
  @Type(() => MultiSigDetailsModel)
  readonly multiSig?: MultiSigDetailsModel;

  constructor(model: AccountDetailsModel) {
    Object.assign(this, model);
  }
}
