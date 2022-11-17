/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { FeesModel } from '~/common/models/fees.model';
import { TransactionDetails } from '~/transactions/transactions.util';

export class TransactionDetailsModel {
  @ApiProperty({ type: 'string', example: 'pending' })
  readonly status: string;

  @ApiProperty({ type: 'string', example: '2' })
  readonly fees: FeesModel;

  @ApiProperty({ type: 'boolean', example: true })
  readonly supportsSubsidy: boolean;

  // TODO: define a model for this
  @ApiProperty({ type: 'string', example: '2' })
  readonly payingAccount: TransactionDetails['payingAccount'];

  constructor(model: TransactionDetails) {
    Object.assign(this, model);
  }
}
