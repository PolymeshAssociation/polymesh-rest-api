/* istanbul ignore file */

import { Type } from 'class-transformer';

import { ApiPropertyOneOf } from '~/common/decorators/swagger';
import { BatchTransactionModel } from '~/common/models/batch-transaction.model';
import { TransactionIdentifierModel } from '~/common/models/transaction-identifier.model';
import { TransactionModel } from '~/common/models/transaction.model';

export class TransactionQueueModel {
  @ApiPropertyOneOf({
    description: 'List of transactions',
    isArray: true,
    union: [TransactionModel, BatchTransactionModel],
  })
  @Type(() => TransactionIdentifierModel, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'batchTransaction',
      subTypes: [
        {
          value: TransactionModel,
          name: 'false',
        },
        {
          value: BatchTransactionModel,
          name: 'true',
        },
      ],
    },
  })
  transactions: (TransactionModel | BatchTransactionModel)[];

  constructor(model: TransactionQueueModel) {
    Object.assign(this, model);
  }
}
