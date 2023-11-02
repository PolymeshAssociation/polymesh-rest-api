/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { MetadataType } from '@polymeshassociation/polymesh-sdk/types';

import { FromBigNumber } from '~/common/decorators/transformation';
import { MetadataSpecModel } from '~/metadata/models/metadata-spec.model';

export class CollectionKeyModel {
  @ApiProperty({
    description: 'Whether the metadata entry is Global or Local',
    example: MetadataType.Local,
  })
  readonly type: MetadataType;

  @ApiProperty({
    description: 'The ID of the metadata entry',
    example: '1',
  })
  @FromBigNumber()
  readonly id: BigNumber;

  @ApiProperty({
    description: 'The name of the metadata entry',
    example: 'Token info',
  })
  readonly name: string;

  @ApiPropertyOptional({
    description: 'The specifications of the metadata entry',
  })
  readonly specs: MetadataSpecModel;

  constructor(args: CollectionKeyModel) {
    Object.assign(this, args);
  }
}
