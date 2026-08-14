/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators/transformation';

export class SignerCountModel {
  @ApiProperty({
    description: 'The number of signers allowed by the Venue',
    type: 'string',
    example: '1',
  })
  @FromBigNumber()
  readonly count: BigNumber;

  constructor(model: SignerCountModel) {
    Object.assign(this, model);
  }
}
