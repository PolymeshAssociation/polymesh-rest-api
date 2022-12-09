/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { PayingAccountType } from '@polymeshassociation/polymesh-sdk/types';

import { FromBigNumber } from '~/common/decorators/transformation';

export class PayingAccountModel {
  @ApiProperty({
    type: 'string',
    description: 'The balance of the paying account',
    example: '29996999.366176',
  })
  @FromBigNumber()
  readonly balance: BigNumber;

  @ApiProperty({
    description: 'Paying account type',
    enum: PayingAccountType,
    example: PayingAccountType.Caller,
  })
  readonly type: string;

  @ApiProperty({
    type: 'string',
    description: 'The paying account address',
    example: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
  })
  readonly address: string;

  constructor(model: PayingAccountModel) {
    Object.assign(this, model);
  }
}
