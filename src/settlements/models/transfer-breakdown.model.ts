import { ApiProperty } from '@nestjs/swagger';
import {
  Compliance,
  TransferError,
  TransferRestrictionResult,
} from '@polymeshassociation/polymesh-sdk/types';

import { FromEntityObject } from '~/common/decorators/transformation';

export class TransferBreakdownModel {
  @ApiProperty({
    description: 'List of general transfer errors',
    type: 'string',
    enum: TransferError,
    example: [TransferError.InvalidSenderPortfolio, TransferError.InvalidSenderCdd],
  })
  readonly general: TransferError[];

  @ApiProperty({
    description: 'Compliance rules for the Asset, and whether the Asset transfer adheres to them',
  })
  @FromEntityObject()
  readonly compliance: Compliance;

  @ApiProperty({
    description: 'List of transfer restrictions and whether the transfer satisfies each one',
  })
  @FromEntityObject()
  readonly restrictions: TransferRestrictionResult[];

  @ApiProperty({
    description: 'Indicator to know if the transfer is possible.',
    type: 'boolean',
    example: true,
  })
  readonly result: boolean;

  constructor(model: TransferBreakdownModel) {
    Object.assign(this, model);
  }
}
