/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { TransactionDetailsModel } from '~/common/models/transaction-details.model';
import { TransactionPayloadModel } from '~/common/models/transaction-payload.model';

export class TransactionPayloadResultModel {
  @ApiProperty({
    description: 'The SDK transaction payload',
    type: TransactionPayloadModel,
  })
  @Type(() => TransactionPayloadModel)
  readonly transactionPayload: TransactionPayloadModel;

  @ApiProperty({
    description: 'Transaction details',
  })
  @Type(() => TransactionDetailsModel)
  readonly details: TransactionDetailsModel;

  constructor(model: TransactionPayloadResultModel) {
    Object.assign(this, model);
  }
}
