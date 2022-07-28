/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { HistoricAgentOperation } from '@polymathnetwork/polymesh-sdk/types';
import { Type } from 'class-transformer';

import { EventIdentifierModel } from '~/common/models/event-identifier.model';

export class AgentOperationModel {
  @ApiProperty({
    description: 'DID of the Agent that performed the operations',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  readonly did: string;

  @ApiProperty({
    description: 'List of Asset Operation Events that were triggered by the Agent Identity',
    type: EventIdentifierModel,
    isArray: true,
  })
  @Type(() => EventIdentifierModel)
  readonly history: EventIdentifierModel[];

  constructor(data: HistoricAgentOperation) {
    const {
      identity: { did },
      history,
    } = data;
    Object.assign(this, {
      did,
      history: history.map(eventIdentifier => new EventIdentifierModel(eventIdentifier)),
    });
  }
}
