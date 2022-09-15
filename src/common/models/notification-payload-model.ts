/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { EventType, TransactionUpdatePayload } from '~/events/types';

export class NotificationPayloadModel {
  @ApiProperty({
    description:
      'The ID of the subscription. Events related to the transaction will contain this ID in the payload',
    example: 1,
  })
  readonly subscriptionId: number;

  @ApiProperty({
    description: 'The nonce for the subscription',
    example: 0,
  })
  readonly nonce: number;

  @ApiProperty({
    description: 'The type of event',
    enum: EventType,
  })
  readonly type: EventType;

  @ApiProperty({
    description: 'The payload of the transaction subscribed too',
  })
  readonly payload: TransactionUpdatePayload;

  constructor(model: NotificationPayloadModel) {
    Object.assign(this, model);
  }
}
