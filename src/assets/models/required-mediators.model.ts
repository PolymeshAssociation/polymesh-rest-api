/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

export class RequiredMediatorsModel {
  @ApiProperty({
    description: 'Required mediators for an asset',
    example: ['0x0600000000000000000000000000000000000000000000000000000000000000'],
    isArray: true,
  })
  readonly mediators: string[];

  constructor(model: RequiredMediatorsModel) {
    Object.assign(this, model);
  }
}
