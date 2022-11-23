/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { MetadataEntryModel } from '~/metadata/models/metadata-entry.model';

export class CreatedMetadataEntryModel extends TransactionQueueModel {
  @ApiProperty({
    description: 'Details of the newly created Asset Metadata',
    // type: () => MetadataEntryModel,
  })
  // @Type(() => MetadataEntryModel)
  readonly metadata: MetadataEntryModel;

  constructor(model: CreatedMetadataEntryModel) {
    const { transactions, ...rest } = model;
    super({ transactions });

    Object.assign(this, rest);
  }
}
