/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators/transformation';

export class IssuedInFundingRoundModel {
  @ApiProperty({
    description: 'The name of the funding round',
    example: 'Series A',
  })
  readonly fundingRound: string;

  @ApiProperty({
    description: 'The total amount of the Asset issued in the funding round',
    type: 'string',
    example: '1000',
  })
  @FromBigNumber()
  readonly issued: BigNumber;

  constructor(model: IssuedInFundingRoundModel) {
    Object.assign(this, model);
  }
}
