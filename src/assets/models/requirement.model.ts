/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Condition } from '@polymathnetwork/polymesh-sdk/types';

import { FromEntityObject } from '~/common/decorators/transformation';

export class RequirementModel {
  @ApiProperty({
    description: 'Unique ID of the Requirement',
    type: 'number',
    example: '1',
  })
  readonly id: number;

  @ApiProperty({
    description: 'List of Conditions',
    isArray: true,
    example: [
      {
        type: 'IsPresent',
        claim: {
          type: 'Accredited',
          scope: {
            type: 'Identity',
            value: '0x0600000000000000000000000000000000000000000000000000000000000000',
          },
        },
        target: 'Receiver',
        trustedClaimIssuers: [],
      },
    ],
  })
  @FromEntityObject()
  readonly conditions: Condition[];

  constructor(model: RequirementModel) {
    Object.assign(this, model);
  }
}
