/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators/transformation';

class OfferingTierModel {
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

  constructor(model: OfferingTierModel) {
    Object.assign(this, model);
  }
}

export class TierModel extends OfferingTierModel {
  @ApiProperty({
    description: 'Total amount remaining for purchase in the Tier',
    type: 'string',
    example: '100',
  })
  @FromBigNumber()
  readonly remaining: BigNumber;

  constructor(model: TierModel) {
    const { remaining, ...stoTier } = model;
    super({ ...stoTier });

    this.remaining = remaining;
  }
}
