/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { TransactionIdentifierModel } from '~/common/models/transaction-identifier.model';
import { TransactionType } from '~/common/types';

export class BatchTransactionModel extends TransactionIdentifierModel {
  @ApiProperty({
    description:
      'List of Transaction type identifier (for UI purposes). The format for each identifier is <palletName>.<transactionName>',
    type: 'string',
    isArray: true,
    example: 'asset.RegisterUniqueTicker',
  })
  readonly transactionTags?: string[];

  declare readonly type: TransactionType.Batch;

  constructor(model: Omit<BatchTransactionModel, 'type'>) {
    const { transactionTags, ...rest } = model;
    super({ ...rest, type: TransactionType.Batch });
    this.transactionTags = transactionTags;
  }
}
