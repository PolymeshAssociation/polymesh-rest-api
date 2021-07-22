import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { Identity } from '@polymathnetwork/polymesh-sdk/types';

import { FromBigNumber, FromEntity } from '~/common/decorators/transformation';

export class IdentityBalanceModel {
  @ApiProperty({
    description: 'The DID of the Asset Holder',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @FromEntity()
  readonly identity: Identity;

  @ApiProperty({
    description: 'The existing balance with the Asset Holder',
    type: 'string',
    example: '12345',
  })
  @FromBigNumber()
  readonly balance: BigNumber;

  constructor(model: IdentityBalanceModel) {
    Object.assign(this, model);
  }
}
