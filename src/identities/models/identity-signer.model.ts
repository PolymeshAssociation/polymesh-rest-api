/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { SignerType } from '@polymathnetwork/polymesh-sdk/types';

import { SignerModel } from '~/identities/models/signer.model';

export class IdentitySignerModel extends SignerModel {
  @ApiProperty({
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
    description: 'Unique Identity identifier (DID: Decentralized IDentity)',
  })
  readonly did: string;

  constructor(model: Omit<IdentitySignerModel, 'signerType'>) {
    super({ signerType: SignerType.Identity });
    Object.assign(this, model);
  }
}
