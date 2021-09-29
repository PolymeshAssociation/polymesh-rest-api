/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class TransactionIdentifierModel {
  @ApiProperty({
    description: 'Hash of the block',
    type: 'string',
    example: '0x0372a35b1ae2f622142aa8519ce70b0980fb35727fd0348d204dfa280f2f5987',
  })
  readonly blockHash: string;

  @ApiProperty({
    description: 'Hash of the transaction',
    type: 'string',
    example: '0xe0346b494edcca5a30b12f3ef128e54dfce412dbf5a0202b3e69c926267d1473',
  })
  readonly transactionHash: string;

  @ApiProperty({
    description:
      'Transaction type identifier (for UI purposes). The format is <palletName>.<transactionName>',
    type: 'string',
    example: 'asset.registerTicker',
  })
  readonly transactionTag: string;
}

export class TransactionQueueModel {
  @ApiProperty({
    description: 'List of transactions',
    type: TransactionIdentifierModel,
    isArray: true,
  })
  @Type(() => TransactionIdentifierModel)
  transactions: TransactionIdentifierModel[];

  constructor(model: TransactionQueueModel) {
    Object.assign(this, model);
  }
}
