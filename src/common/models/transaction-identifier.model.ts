/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators/transformation';
import { TransactionType } from '~/common/types';

export class TransactionIdentifierModel {
  @ApiProperty({
    description:
      'Number of the block where the transaction resides (status: `Succeeded`, `Failed`)',
    type: 'string',
    example: '123',
  })
  @FromBigNumber()
  readonly blockNumber: BigNumber;

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
    description: 'Indicator to know if the transaction is a batch transaction or not',
    enum: TransactionType,
    type: 'string',
    example: TransactionType.Single,
  })
  readonly type: TransactionType;

  constructor(model: TransactionIdentifierModel) {
    Object.assign(this, model);
  }
}
