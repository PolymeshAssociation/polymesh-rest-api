/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { apiKeyHeader } from '~/auth/strategies/api-key.strategy';

export class ApiKeyModel {
  @ApiProperty({
    type: 'string',
    description: 'The user id associated to this key',
    example: '1',
  })
  readonly userId: string;

  @ApiProperty({
    type: 'string',
    description: `A secret to use for the value of ${apiKeyHeader} on requests`,
    example: 'XsQMQRpJqI/ViSdRXEa129mjOT9eJGn3pWGQL1S7Ibw=',
  })
  readonly secret: string;

  constructor(model: ApiKeyModel) {
    Object.assign(this, model);
  }
}
