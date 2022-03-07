/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { TransactionType } from '~/common/consts';
import { TransactionIdentifierModel } from '~/common/models/transaction-identifier.model';

export class BatchTransactionModel extends TransactionIdentifierModel {
  @ApiProperty({
    description:
      'List of Transaction type identifier (for UI purposes). The format for each identifier is <palletName>.<transactionName>',
    type: 'string',
    isArray: true,
    example: 'asset.registerTicker',
  })
  readonly transactionTags?: string[];

  constructor(model: Omit<BatchTransactionModel, 'type'>) {
    const { transactionTags, ...rest } = model;
    super({ ...rest, type: TransactionType.Batch });
    this.transactionTags = transactionTags;
  }
}
