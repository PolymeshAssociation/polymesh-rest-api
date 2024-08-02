/* istanbul ignore file */

import { ApiExtraModels, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MultiSigProposal } from '@polymeshassociation/polymesh-sdk/types';
import { Type } from 'class-transformer';

import { ApiPropertyOneOf, FromEntity } from '~/common/decorators';
import { BatchTransactionModel } from '~/common/models/batch-transaction.model';
import { TransactionModel } from '~/common/models/transaction.model';
import { TransactionDetailsModel } from '~/common/models/transaction-details.model';
import { TransactionIdentifierModel } from '~/common/models/transaction-identifier.model';
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
  @Type(() => TransactionDetailsModel)
  details: TransactionDetailsModel;

  @ApiPropertyOptional({
    description:
      'Proposal information. Set if the signer was a MultiSig signer and the transaction was wrapped as a proposal',
    example: {
      multiSigAddress: '5DSv9np6VuG7XeNnudfvvs3VS9P6Q36DMiU4wxGHMkeFGbgZ',
      id: '7',
    },
  })
  @FromEntity()
  readonly proposal?: MultiSigProposal;

  constructor(model: TransactionQueueModel) {
    Object.assign(this, model);
  }
}
