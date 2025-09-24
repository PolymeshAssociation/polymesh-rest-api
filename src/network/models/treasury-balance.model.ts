/* istanbul ignore file */
import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators/transformation';

export class TreasuryBalanceModel {
  @ApiProperty({
    description: 'Amount of POLYX held in the treasury',
    type: 'string',
    example: '100000000',
  })
  @FromBigNumber()
  readonly balance: BigNumber;

  constructor(model: TreasuryBalanceModel) {
    Object.assign(this, model);
  }
}
