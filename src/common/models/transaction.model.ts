/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { TransactionIdentifierModel } from '~/common/models/transaction-identifier.model';

export class TransactionModel extends TransactionIdentifierModel {
  @ApiProperty({
    description:
      'Transaction type identifier (for UI purposes). The format is <palletName>.<transactionName>',
    type: 'string',
    example: 'asset.registerTicker',
  })
  readonly transactionTag: string;

  constructor(model: Omit<TransactionModel, 'batchTransaction'>) {
    const { transactionTag, ...rest } = model;
    super({ ...rest, batchTransaction: false });
    this.transactionTag = transactionTag;
  }
}
