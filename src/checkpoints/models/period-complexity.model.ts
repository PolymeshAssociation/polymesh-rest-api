/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators/transformation';

export class PeriodComplexityModel {
  @ApiProperty({
    description: 'Total calculated complexity for given period',
    type: 'string',
    example: '10000',
  })
  @FromBigNumber()
  readonly complexity: BigNumber;

  constructor(model: PeriodComplexityModel) {
    Object.assign(this, model);
  }
}
