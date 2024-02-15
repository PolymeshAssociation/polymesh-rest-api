/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

export class RequiredMediatorsModel {
  @ApiProperty({
    description: 'Required mediators for an asset',
  })
  readonly mediators: string[];

  constructor(model: RequiredMediatorsModel) {
    Object.assign(this, model);
  }
}
