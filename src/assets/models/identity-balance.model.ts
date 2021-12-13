/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators/transformation';

export class IdentityBalanceModel {
  @ApiProperty({
    description: 'The DID of the Asset Holder',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  readonly identity: string;

  @ApiProperty({
    description: 'Balance held by the Identity',
    type: 'string',
    example: '12345',
  })
  @FromBigNumber()
  readonly balance: BigNumber;

  constructor(model: IdentityBalanceModel) {
    Object.assign(this, model);
  }
}
