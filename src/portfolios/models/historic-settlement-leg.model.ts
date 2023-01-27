/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { SettlementDirectionEnum } from '@polymeshassociation/polymesh-sdk/types';

export class HistoricSettlementLegModel {
  @ApiProperty({
    description: 'The direction of the settlement leg',
    example: SettlementDirectionEnum.Incoming,
    enum: SettlementDirectionEnum,
  })
  readonly direction: string;

  constructor(model: HistoricSettlementLegModel) {
    Object.assign(this, model);
  }
}
