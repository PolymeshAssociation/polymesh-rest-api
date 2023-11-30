/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators/transformation';

export class CustomClaimTypeModel {
  @ApiProperty({
    type: 'string',
    description: 'CustomClaimType Id',
    example: 1,
  })
  @FromBigNumber()
  readonly id: BigNumber;

  @ApiProperty({
    type: 'string',
    description: 'CustomClaimType name',
    example: 'CustomClaimType',
  })
  readonly name: string;

  constructor(model: CustomClaimTypeModel) {
    Object.assign(this, model);
  }
}
