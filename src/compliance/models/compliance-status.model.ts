/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { FromBigNumber } from '~/common/decorators/transformation';

export class ComplianceStatusModel {
  @ApiProperty({
    description: 'Are the compliance requirements paused',
    type: 'boolean',
    example: true,
  })
  @FromBigNumber()
  readonly arePaused: boolean;

  constructor(model: ComplianceStatusModel) {
    Object.assign(this, model);
  }
}
