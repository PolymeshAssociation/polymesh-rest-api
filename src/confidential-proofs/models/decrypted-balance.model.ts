/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators/transformation';

export class DecryptedBalanceModel {
  @ApiProperty({
    description: 'Decrypted balance value',
    type: 'string',
    example: '100',
  })
  @FromBigNumber()
  readonly value: BigNumber;

  constructor(model: DecryptedBalanceModel) {
    Object.assign(this, model);
  }
}
