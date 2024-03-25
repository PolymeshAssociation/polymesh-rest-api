/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators/transformation';

export class SubmitResultModel {
  @ApiProperty({
    description: 'The block hash the transaction was included in',
    example: '0x08e8dc9104dbe8a6f38b59c2a44b29348e1a204824fe8514ae3c40a015210d9e',
    type: 'string',
  })
  readonly blockHash: string;

  @ApiProperty({
    description: 'The index of the transaction within the block',
    type: 'string',
    example: '1',
  })
  @FromBigNumber()
  readonly transactionIndex: BigNumber;

  @ApiProperty({
    description: 'The transaction hash of the submitted transaction',
    type: 'string',
    example: '0x92cfb6d8cd3186e46e3cc7319ea0bca0f6a990026b30519e1cb43bb8351b3650',
  })
  readonly transactionHash: string;

  constructor(model: SubmitResultModel) {
    Object.assign(this, model);
  }
}
