/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { TransactionType } from '~/common/consts';
import { TransactionIdentifierModel } from '~/common/models/transaction-identifier.model';

export class TransactionModel extends TransactionIdentifierModel {
  @ApiProperty({
    description:
      'Transaction type identifier (for UI purposes). The format is <palletName>.<transactionName>',
    type: 'string',
    example: 'asset.registerTicker',
  })
  readonly transactionTag: string;

  constructor(model: Omit<TransactionModel, 'type'>) {
    const { transactionTag, ...rest } = model;
    super({ ...rest, type: TransactionType.Single });
    this.transactionTag = transactionTag;
  }
}
