/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

export class ConfidentialAccountModel {
  @ApiProperty({
    description: 'The public key of the Confidential Account',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  readonly publicKey: string;

  constructor(model: ConfidentialAccountModel) {
    Object.assign(this, model);
  }
}
