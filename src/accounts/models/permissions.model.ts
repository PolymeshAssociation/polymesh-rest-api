/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { TxGroup } from '@polymathnetwork/polymesh-sdk/types';
import { Type } from 'class-transformer';

import { AssetPermissionsModel } from '~/accounts/models/asset-permissions.model';
import { PortfolioPermissionsModel } from '~/accounts/models/portfolio-permissions.model';
import { TransactionPermissionsModel } from '~/accounts/models/transaction-permissions.model';

export class PermissionsModel {
  @ApiProperty({
    description:
      'Assets over which the Account has permissions. A null value represents full permissions',
    type: AssetPermissionsModel,
    nullable: true,
  })
  @Type(() => AssetPermissionsModel)
  readonly assets: AssetPermissionsModel | null;

  @ApiProperty({
    description:
      'Portfolios over which the Account has permissions. A null value represents full permissions',
    type: PortfolioPermissionsModel,
    nullable: true,
  })
  @Type(() => PortfolioPermissionsModel)
  readonly portfolios: PortfolioPermissionsModel | null;

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
      'Transaction Groups that the Account can execute. Having permissions over a TxGroup means having permissions over every TxTag in said group. Note if `transactions` is null, ignore this value',
    isArray: true,
    enum: TxGroup,
    example: [TxGroup.PortfolioManagement],
  })
  readonly transactionGroups: TxGroup[];

  constructor(model: PermissionsModel) {
    Object.assign(this, model);
  }
}
