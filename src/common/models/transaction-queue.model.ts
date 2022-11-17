/* istanbul ignore file */

import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { ApiPropertyOneOf } from '~/common/decorators/swagger';
import { BatchTransactionModel } from '~/common/models/batch-transaction.model';
import { TransactionDetailsModel } from '~/common/models/transaction-details.model';
import { TransactionIdentifierModel } from '~/common/models/transaction-identifier.model';
import { TransactionModel } from '~/common/models/transaction.model';
import { TransactionType } from '~/common/types';

@ApiExtraModels(TransactionModel, BatchTransactionModel)
export class TransactionQueueModel {
  @ApiPropertyOneOf({
    description: 'List of transactions',
    isArray: true,
    union: [TransactionModel, BatchTransactionModel],
  })
  @Type(() => TransactionIdentifierModel, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'type',
      subTypes: [
        {
          value: TransactionModel,
          name: TransactionType.Single,
        },
        {
          value: BatchTransactionModel,
          name: TransactionType.Batch,
        },
      ],
    },
  })
  transactions: (TransactionModel | BatchTransactionModel)[];

  @ApiProperty({
    description: 'Transaction details',
    isArray: true,
  })
  details: TransactionDetailsModel;

  constructor({ details, ...rest }: TransactionQueueModel) {
    Object.assign(this, { ...rest, details: new TransactionDetailsModel(details) });
  }
}
