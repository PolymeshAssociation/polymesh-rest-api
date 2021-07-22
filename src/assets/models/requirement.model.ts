import { ApiProperty } from '@nestjs/swagger';
import { Condition } from '@polymathnetwork/polymesh-sdk/types';

import { FromEntityObject } from '~/common/decorators/transformation';

export class RequirementModel {
  @ApiProperty({
    description: 'Unique id of the Requirement',
    type: 'number',
    example: '1',
  })
  readonly id: number;

  @ApiProperty({
    description: 'List of Conditions',
    example: 'Condition',
    isArray: true,
  })
  @FromEntityObject()
  readonly conditions: Condition[];

  constructor(model: RequirementModel) {
    Object.assign(this, model);
  }
}
