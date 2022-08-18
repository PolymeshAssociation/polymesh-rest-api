/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { SignerType } from '@polymeshassociation/polymesh-sdk/types';

export class SignerModel {
  @ApiProperty({
    description: 'Type of the Signer',
    enum: SignerType,
    type: 'string',
    example: SignerType.Account,
  })
  readonly signerType: SignerType;

  constructor(model: SignerModel) {
    Object.assign(this, model);
  }
}
