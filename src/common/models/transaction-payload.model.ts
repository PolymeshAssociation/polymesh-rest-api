/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { TransactionPayload } from '@polymeshassociation/polymesh-sdk/types';
import { Type } from 'class-transformer';

import { TransactionDetailsModel } from '~/common/models/transaction-details.model';

export class TransactionPayloadModel {
  @ApiProperty({
    description: 'SDK payload',
  })
  unsignedTransaction: TransactionPayload;

  @ApiProperty({
    description: 'Transaction details',
    isArray: true,
  })
  @Type(() => TransactionDetailsModel)
  details: TransactionDetailsModel;

  constructor(model: TransactionPayloadModel) {
    Object.assign(this, model);
  }
}
