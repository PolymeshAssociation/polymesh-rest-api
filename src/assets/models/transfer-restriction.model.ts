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

  @ApiProperty({
    description: 'DIDs that are exempted from this restriction',
    type: 'string',
    isArray: true,
    required: false,
    example: ['0x0600...', '0x0100...'],
  })
  readonly exemptedIds?: string[];

  constructor(model: TransferRestrictionModel) {
    Object.assign(this, model);
  }
}
