/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { TransferRestrictionType } from '@polymeshassociation/polymesh-sdk/types';

export class TransferRestrictionModel {
  @ApiProperty({
    description: 'Type of transfer restriction',
    enum: TransferRestrictionType,
    example: TransferRestrictionType.Count,
  })
  readonly type: TransferRestrictionType;

  constructor(model: TransferRestrictionModel) {
    Object.assign(this, model);
  }
}
