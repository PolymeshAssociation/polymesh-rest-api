/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { MetadataEntryModel } from '~/metadata/models/metadata-entry.model';
import { MetadataSpecModel } from '~/metadata/models/metadata-spec.model';
import { MetadataValueModel } from '~/metadata/models/metadata-value.model';

export class MetadataDetailsModel extends MetadataEntryModel {
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

  @ApiProperty({
    description:
      'Asset Metadata value and its details (expiry + lock status). `null` means that value is not yet set',
    type: MetadataValueModel,
    nullable: true,
  })
  @Type(() => MetadataValueModel)
  readonly value: MetadataValueModel | null;

  constructor(model: MetadataDetailsModel) {
    const { id, type, asset, ...rest } = model;
    super({ id, type, asset });

    Object.assign(this, rest);
  }
}
