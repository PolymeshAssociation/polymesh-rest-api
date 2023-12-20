/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { TransactionPayload } from '@polymeshassociation/polymesh-sdk/types';

import { FromBigNumber } from '~/common/decorators/transformation';

export class OfflineReceiptModel {
  @ApiProperty({
    description: 'The AMQP delivery ID',
    type: BigNumber,
  })
  @FromBigNumber()
  readonly deliveryId: BigNumber;

  @ApiProperty({
    description: 'The AMQP topic the message was published on',
  })
  readonly topicName: string;

  @ApiProperty({
    description: 'The transaction payload data',
  })
  readonly payload: TransactionPayload['payload'];

  @ApiProperty({
    description: 'Metadata associated with the transaction',
  })
  readonly metadata: TransactionPayload['metadata'];

  constructor(model: OfflineReceiptModel) {
    Object.assign(this, model);
  }
}
