/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { EventType, TransactionUpdatePayload } from '~/events/types';

export class NotificationPayloadModel {
  @ApiProperty({
    description:
      'The ID of the subscription. Events related to the transaction will contain this ID in the payload',
  })
  subscriptionId: number;

  @ApiProperty({
    description: 'The nonce for the subscription',
  })
  nonce: number;

  @ApiProperty({
    description: 'The type of event',
  })
  type: EventType;

  @ApiProperty({
    description: 'The payload of the transaction subscribed too',
  })
  payload: TransactionUpdatePayload;

  constructor(model: NotificationPayloadModel) {
    Object.assign(this, model);
  }
}
