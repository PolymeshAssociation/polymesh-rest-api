/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Condition } from '@polymeshassociation/polymesh-sdk/types';

import { FromBigNumber, FromEntityObject } from '~/common/decorators/transformation';

export class RequirementModel {
  @ApiProperty({
    description: 'Unique ID of the Requirement',
    type: 'string',
    example: '1',
  })
  @FromBigNumber()
  readonly id: BigNumber;

  @ApiProperty({
    description: 'List of Conditions',
    isArray: true,
    type: 'object',
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
