/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { FromBigNumber } from '~/common/decorators/transformation';

export class ComplianceStatusModel {
  @ApiProperty({
    description: 'Indicator to know if compliance requirements are paused or not',
    type: 'boolean',
    example: true,
  })
  readonly arePaused: boolean;

  constructor(model: ComplianceStatusModel) {
    Object.assign(this, model);
  }
}
