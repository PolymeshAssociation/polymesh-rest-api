/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

export class SignerModel {
  @ApiProperty({
    type: 'string',
    description: 'The address associated to the signer',
    example: '5GwwYnwCYcJ1Rkop35y7SDHAzbxrCkNUDD4YuCUJRPPXbvyV',
  })
  readonly address: string;

  constructor(model: SignerModel) {
    Object.assign(this, model);
  }
}
