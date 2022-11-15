/* istanbul ignore file */
import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators/transformation';

export class NetworkPropertiesModel {
  @ApiProperty({
    description: 'Network name',
    type: 'string',
    example: 'Development',
  })
  readonly name: string;

  @ApiProperty({
    description: 'Network version number',
    type: 'string',
    example: '1',
  })
  @FromBigNumber()
  readonly version: BigNumber;

  constructor(model: NetworkPropertiesModel) {
    Object.assign(this, model);
  }
}
