/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators/transformation';

export class BalanceModel {
  @ApiProperty({
    type: 'string',
    description: 'Free asset amount',
    example: '123',
  })
  @FromBigNumber()
  readonly free: BigNumber;

  @ApiProperty({
    type: 'string',
    description: 'Locked asset amount',
    example: '456',
  })
  @FromBigNumber()
  readonly locked: BigNumber;

  @ApiProperty({
    type: 'string',
    description: 'Sum total of locked and free asset amount',
    example: '578',
  })
  @FromBigNumber()
  readonly total: BigNumber;

  constructor(model: BalanceModel) {
    Object.assign(this, model);
  }
}
