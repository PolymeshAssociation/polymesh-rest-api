/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { SettlementDirectionEnum } from '@polymeshassociation/polymesh-sdk/types';

export class SettlementLegModel {
  @ApiProperty({
    description: 'The direction of the settlement leg',
    example: SettlementDirectionEnum.Incoming,
    enum: SettlementDirectionEnum,
  })
  readonly direction: string;

  constructor(model: SettlementLegModel) {
    Object.assign(this, model);
  }
}
