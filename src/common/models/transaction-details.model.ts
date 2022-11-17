/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { TransactionStatus } from '@polymeshassociation/polymesh-sdk/types';

import { FeesModel } from '~/common/models/fees.model';
import { PayingAccountModel } from '~/common/models/paying-account.model';

export class TransactionDetailsModel {
  @ApiProperty({
    description: 'Transaction status',
    enum: TransactionStatus,
    example: TransactionStatus.Idle,
  })
  readonly status: string;

  @ApiProperty({ description: 'Transaction fees', type: FeesModel })
  readonly fees: FeesModel;

  @ApiProperty({ type: 'boolean', example: true })
  readonly supportsSubsidy: boolean;

  @ApiProperty({
    description: 'Paying account details',
    type: PayingAccountModel,
  })
  readonly payingAccount: PayingAccountModel;

  constructor({ status, fees, supportsSubsidy, payingAccount }: TransactionDetailsModel) {
    Object.assign(this, {
      status,
      supportsSubsidy,
      payingAccount: new PayingAccountModel(payingAccount),
      fees: new FeesModel(fees),
    });
  }
}
