/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

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

  constructor(model: Omit<BatchTransactionModel, 'batchTransaction'>) {
    const { transactionTags, ...rest } = model;
    super({ ...rest, batchTransaction: false });
    this.transactionTags = transactionTags;
  }
}
