/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Identity } from '@polymathnetwork/polymesh-sdk/internal';
import { TargetTreatment } from '@polymathnetwork/polymesh-sdk/types';

import { FromMaybeEntityArray } from '~/common/decorators/transformation';

export class CorporateActionTargetsModel {
  @ApiProperty({
    description: 'Indicates how the `identities` are to be treated',
    type: 'string',
    enum: TargetTreatment,
    example: TargetTreatment.Include,
  })
  readonly treatment: TargetTreatment;

  @ApiProperty({
    description:
      'The list of DIDs either relevant or irrelevant, depending on `treatment`, for Corporate Actions',
    type: 'string',
    isArray: true,
    example: [
      '0x0600000000000000000000000000000000000000000000000000000000000000',
      '0x0611111111111111111111111111111111111111111111111111111111111111',
    ],
  })
  @FromMaybeEntityArray()
  readonly identities: Identity[];

  constructor(model: CorporateActionTargetsModel) {
    Object.assign(this, model);
  }
}
