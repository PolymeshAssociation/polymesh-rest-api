/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { HistoricAgentOperation } from '@polymathnetwork/polymesh-sdk/types';
import { Type } from 'class-transformer';

import { EventIdentifierModel } from '~/common/models/event-identifier.model';
import { IdentitySignerModel } from '~/identities/models/identity-signer.model';

export class AgentOperationModel {
  @ApiProperty({
    description: 'Agent Identity that performed the operations',
    type: IdentitySignerModel,
  })
  @Type(() => IdentitySignerModel)
  readonly identity: IdentitySignerModel;

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
      identity: new IdentitySignerModel({ did }),
      history: history.map(eventIdentifier => new EventIdentifierModel(eventIdentifier)),
    });
  }
}
