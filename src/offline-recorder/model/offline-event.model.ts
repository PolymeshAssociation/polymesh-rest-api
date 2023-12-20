/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { TopicName } from '~/common/utils/amqp';
import { AnyModel } from '~/offline-recorder/model/any.model';

export class OfflineEventModel {
  @ApiProperty({
    type: 'string',
    description: 'Thw topic this event was published on',
    example: 'Alice',
    enum: TopicName,
  })
  readonly topicName: TopicName;

  @ApiProperty({
    type: 'string',
    description: 'The event body',
    example: '{ "id": 1, "transaction": {} }',
  })
  readonly body: AnyModel;

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
