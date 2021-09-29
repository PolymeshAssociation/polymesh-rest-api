/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Permissions } from '@polymathnetwork/polymesh-sdk/types';
import { Type } from 'class-transformer';

import { FromEntityObject } from '~/common/decorators/transformation';
import { SignerModel } from '~/identities/models/signer.model';

export class SecondaryKeyModel {
  @ApiProperty({
    description: 'Signer details',
    type: () => SignerModel,
  })
  @Type(() => SignerModel)
  readonly signer: SignerModel;

  @ApiProperty({
    description: 'Permissions present with this secondary key',
  })
  @FromEntityObject()
  readonly permissions: Permissions;

  constructor(model: SecondaryKeyModel) {
    Object.assign(this, model);
  }
}
