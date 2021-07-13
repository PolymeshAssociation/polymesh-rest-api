/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Claim } from '@polymathnetwork/polymesh-sdk/types';

import { IdentityModel } from '~/identities/models/identity.model';

export class ClaimsModel<ClaimType = Claim> {
  @ApiProperty({
    type: IdentityModel,
    description: 'Details of the target identity',
  })
  target?: IdentityModel;

  @ApiProperty({
    type: IdentityModel,
    description: 'Details of the issuer identity',
  })
  issuer?: IdentityModel;

  @ApiProperty({
    type: Date,
    description: 'Details of the target identity',
  })
  issuedAt?: Date;

  @ApiProperty({
    type: Date,
    nullable: true,
    description: 'Expiry date of the claim',
  })
  expiry?: Date | null;

  @ApiProperty({
    description: 'Details of the claim containing type and scope',
  })
  claim?: ClaimType;

  constructor(model?: ClaimsModel) {
    Object.assign(this, model);
  }
}
