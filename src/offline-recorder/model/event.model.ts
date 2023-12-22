/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { TopicName } from '~/common/utils/amqp';

export class OfflineEventModel {
  @ApiProperty({
    type: 'string',
    description: 'Queue name this event was published on',
    example: 'Alice',
    enum: TopicName,
  })
  readonly name: TopicName;

  @ApiProperty({
    type: 'string',
    description: 'The event body',
    example: '{ "id": 1, "transaction": {} }',
  })
  readonly body: Record<string, unknown>;

  @ApiProperty({
    type: 'string',
    description:
      'The internal ID of the message. The exact format depends on the Datastore being used',
    example: '1',
  })
  readonly id: string;

  constructor(model: OfflineEventModel) {
    Object.assign(this, model);
  }
}
