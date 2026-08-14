/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { BalanceModel } from '~/assets/models/balance.model';
import { FromBigNumber } from '~/common/decorators/transformation';

export class AccountBalanceModel extends BalanceModel {
  @ApiProperty({
    type: 'string',
    description:
      'POLYX placed on hold by the protocol, e.g. bonded for staking. Not part of `free` and cannot be spent until released',
    example: '100',
  })
  @FromBigNumber()
  readonly reserved: BigNumber;

  @ApiProperty({
    type: 'string',
    description:
      'Minimum balance (out of `total`) that must remain in the Account due to freezes/locks (e.g. vesting). May overlap with `reserved`',
    example: '0',
  })
  @FromBigNumber()
  readonly frozen: BigNumber;

  constructor(model: AccountBalanceModel) {
    super(model);
    Object.assign(this, model);
  }
}
