/* istanbul ignore file */
import { ApiProperty } from '@nestjs/swagger';
import { TxGroup } from '@polymeshassociation/polymesh-sdk/types';
import { Type } from 'class-transformer';

import { TransactionPermissionsModel } from '~/accounts/models/transaction-permissions.model';

export class GroupPermissionsModel {
  @ApiProperty({
    description:
      'Transactions that the Account can execute. A null value represents full permissions',
    type: TransactionPermissionsModel,
    nullable: true,
  })
  @Type(() => TransactionPermissionsModel)
  readonly transactions: TransactionPermissionsModel | null;

  @ApiProperty({
    description:
      'Transaction Groups that the Account can execute. Having permissions over a [TxGroup](https://github.com/polymeshassociation/polymesh-sdk/blob/docs/v14/docs/enums/txgroup.md) means having permissions over every TxTag in said group. Note if `transactions` is null, ignore this value',
    isArray: true,
    enum: TxGroup,
    example: [TxGroup.PortfolioManagement],
  })
  readonly transactionGroups: TxGroup[];

  constructor(model: GroupPermissionsModel) {
    Object.assign(this, model);
  }
}
