/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { SignerType } from '@polymathnetwork/polymesh-sdk/types';

import { SignerModel } from '~/identities/models/signer.model';

export class AccountModel extends SignerModel {
  @ApiProperty({
    type: 'string',
    example: '5grwXxxXxxXxxXxxXxxXxxXxxXxxXxxXxxXxxXxxXxxXxxXx',
  })
  readonly address: string;

  constructor(model: Omit<AccountModel, 'signerType'>) {
    super({ signerType: SignerType.Account });
    Object.assign(this, model);
  }
}
