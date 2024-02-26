/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

export class ConfidentialAccountModel {
  @ApiProperty({
    description: 'The public key of the ElGamal key pair',
    type: 'string',
    example: '0xdeadbeef00000000000000000000000000000000000000000000000000000000',
  })
  readonly publicKey: string;

  constructor(model: ConfidentialAccountModel) {
    Object.assign(this, model);
  }
}
