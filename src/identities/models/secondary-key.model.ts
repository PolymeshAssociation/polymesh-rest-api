/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Permissions } from '@polymathnetwork/polymesh-sdk/types';

import { SignerModel } from '~/identities/models/signer.model';

export class SecondaryKeyModel {
  @ApiProperty({
    description: 'Signer details',
  })
  readonly signer: SignerModel;

  @ApiProperty({
    description: 'Permissions present with this secondary key',
  })
  readonly permissions?: Permissions;

  constructor(model?: SecondaryKeyModel) {
    Object.assign(this, model);
  }
}
