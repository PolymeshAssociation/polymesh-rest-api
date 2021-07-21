import { ApiProperty } from '@nestjs/swagger';
import { SignerType } from '@polymathnetwork/polymesh-sdk/types';

import { SignerModel } from './signer.model';

export class IdentitySignerModel extends SignerModel {
  @ApiProperty({
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
    description: 'Unique Identity identifier (DID: Decentralized IDentity)',
  })
  readonly did: string;

  constructor(model: Omit<IdentitySignerModel, 'signerType'>) {
    super({ signerType: SignerType.Account });
    Object.assign(this, model);
  }
}
