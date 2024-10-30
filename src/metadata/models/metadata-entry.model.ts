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
    example: '3616b82e-8e10-80ae-dc95-2ea28b9db8b3',
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
