/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { IsDate } from 'class-validator';

import { AuthorizationModel } from '~/authorizations/models/authorization.model';
import { IdentityModel } from '~/identities/models/identity.model';
import { SignerModel } from '~/identities/models/signer.model';

export class AuthorizationRequestModel {
  @ApiProperty({
    type: 'string',
    description: 'Unique authorization request id',
    example: '123',
  })
  authId: BigNumber;

  @ApiProperty({
    description: 'Identity details of the issuer',
    type: IdentityModel,
  })
  issuer: IdentityModel;

  @ApiProperty({
    description: 'Identity or Account to which the request was made',
  })
  target: SignerModel;

  data: AuthorizationModel;

  @ApiProperty({
    type: Date,
    description: 'Date of expiry of the authorization request',
    nullable: true,
  })
  @IsDate()
  expiry: Date | null;
}
