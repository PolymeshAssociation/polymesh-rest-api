/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Identity, TargetTreatment } from '@polymathnetwork/polymesh-sdk/types';

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
      'Determines which Identities will be affected by the Corporate Action. If the value of `treatment` is `Include`, then all Identities in this array will be affected. Otherwise, every Asset holder Identity **EXCEPT** for the ones in this array will be affected',
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
