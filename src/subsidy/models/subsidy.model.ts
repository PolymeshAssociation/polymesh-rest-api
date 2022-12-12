/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Type } from 'class-transformer';

import { FromBigNumber } from '~/common/decorators/transformation';
import { AccountModel } from '~/identities/models/account.model';

export class SubsidyModel {
  @ApiProperty({
    description: 'Account whose transactions are being paid for',
    type: AccountModel,
  })
  @Type(() => AccountModel)
  readonly beneficiary: AccountModel;

  @ApiProperty({
    description: 'Account that is paying for the transactions',
    type: AccountModel,
  })
  @Type(() => AccountModel)
  readonly subsidizer: AccountModel;

  @ApiProperty({
    description: 'Amount of POLYX being subsidized',
    type: 'string',
    example: '12345',
  })
  @FromBigNumber()
  readonly allowance: BigNumber;

  constructor(model: SubsidyModel) {
    Object.assign(this, model);
  }
}
