/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { MetadataType } from '@polymeshassociation/polymesh-sdk/types';

import { FromBigNumber } from '~/common/decorators/transformation';

export class MetadataEntryModel {
  @ApiProperty({
    description:
      'The Asset for which this is the Metadata for. NOTE: For 6.x chains, asset is represented by its ticker, but from 7.x, asset is represented by its unique Asset ID',
    type: 'string',
    examples: ['TICKER', '0xa3616b82e8e1080aedc952ea28b9db8b'],
  })
  readonly asset: string;

  @ApiProperty({
    description: 'The type of metadata represented by this instance',
    type: 'string',
    enum: MetadataType,
  })
  readonly type: MetadataType;

  @ApiProperty({
    description: 'ID corresponding to defined `type` of Metadata',
    type: 'string',
    example: '1',
  })
  @FromBigNumber()
  readonly id: BigNumber;

  constructor(model: MetadataEntryModel) {
    Object.assign(this, model);
  }
}
