/* istanbul ignore file */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { MetadataEntryModel } from '~/metadata/models/metadata-entry.model';

export class CreatedMetadataEntryModel extends TransactionQueueModel {
  @ApiPropertyOptional({
    description: 'Details of the newly created Asset Metadata',
    type: () => MetadataEntryModel,
  })
  @Type(() => MetadataEntryModel)
  readonly metadata: MetadataEntryModel;

  constructor(model: CreatedMetadataEntryModel) {
    const { transactions, details, ...rest } = model;
    super({ transactions, details });

    Object.assign(this, rest);
  }
}
