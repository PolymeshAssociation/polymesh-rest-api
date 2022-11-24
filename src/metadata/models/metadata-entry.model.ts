/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { MetadataType } from '@polymeshassociation/polymesh-sdk/types';

import { FromBigNumber } from '~/common/decorators/transformation';

export class MetadataEntryModel {
  @ApiProperty({
    description: 'Ticker of the Asset for which this is the metadata',
    type: 'string',
    example: 'TICKER',
  })
  readonly asset: string;

  @ApiProperty({
    description: 'Type of metadata represented by this instance',
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
