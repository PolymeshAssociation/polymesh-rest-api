/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { MetadataType } from '@polymeshassociation/polymesh-sdk/types';

import { FromBigNumber } from '~/common/decorators/transformation';

export class NftMetadataKeyModel {
  @ApiProperty({
    description: 'Whether the metadata is Local or Global',
    type: 'string',
    example: MetadataType.Local,
  })
  readonly type: MetadataType;

  @ApiProperty({
    description: 'The ID of the metadata entry',
    type: 'string',
    example: '1',
  })
  @FromBigNumber()
  readonly id: BigNumber;

  constructor(model: NftMetadataKeyModel) {
    Object.assign(this, model);
  }
}
