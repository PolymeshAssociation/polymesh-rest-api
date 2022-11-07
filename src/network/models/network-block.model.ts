/* istanbul ignore file */
import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators/transformation';

export class NetworkBlockModel {
  @ApiProperty({
    description: 'Latest Block Id',
    type: 'string',
    example: '1',
  })
  @FromBigNumber()
  readonly id: BigNumber;

  constructor(model: NetworkBlockModel) {
    Object.assign(this, model);
  }
}
