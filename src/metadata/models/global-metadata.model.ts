/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Type } from 'class-transformer';

import { FromBigNumber } from '~/common/decorators/transformation';
import { MetadataSpecModel } from '~/metadata/models/metadata-spec.model';

export class GlobalMetadataModel {
  @ApiProperty({
    description: 'ID of the Global Asset Metadata',
    type: 'string',
    example: '1',
  })
  @FromBigNumber()
  readonly id: BigNumber;

  @ApiProperty({
    description: 'Name of the Global Asset Metadata',
    type: 'string',
    example: 'Some metadata',
  })
  readonly name: string;

  @ApiProperty({
    description: 'Specs describing the Asset Metadata',
    type: MetadataSpecModel,
  })
  @Type(() => MetadataSpecModel)
  readonly specs: MetadataSpecModel;

  constructor(model: GlobalMetadataModel) {
    Object.assign(this, model);
  }
}
