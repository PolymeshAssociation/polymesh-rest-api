/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators/transformation';

export class TierModel {
  @ApiProperty({
    description: 'Total amount available in the Tier',
    type: 'string',
    example: '100',
  })
  @FromBigNumber()
  readonly amount: BigNumber;

  @ApiProperty({
    description: 'Price per unit',
    type: 'string',
    example: '1',
  })
  @FromBigNumber()
  readonly price: BigNumber;

  @ApiProperty({
    description: 'Total amount remaining for purchase in the Tier',
    type: 'string',
    example: '100',
  })
  @FromBigNumber()
  readonly remaining: BigNumber;

  constructor(model: TierModel) {
    Object.assign(this, model);
  }
}
