/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators/transformation';

export class FeesModel {
  @ApiProperty({ type: 'string' })
  @FromBigNumber()
  readonly protocol: BigNumber;

  @ApiProperty({ type: 'string' })
  @FromBigNumber()
  readonly gas: BigNumber;

  @ApiProperty({ type: 'string' })
  @FromBigNumber()
  readonly total: BigNumber;

  constructor(model: FeesModel) {
    Object.assign(this, model);
  }
}
