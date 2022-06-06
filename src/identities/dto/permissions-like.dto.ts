/* istanbul ignore file */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { PermissionsLike, TxGroup } from '@polymathnetwork/polymesh-sdk/types';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, ValidateNested } from 'class-validator';

import { AssetPermissionsDto } from '~/identities/dto/asset-permissions.dto';
import { PortfolioPermissionsDto } from '~/identities/dto/portfolio-permissions.dto';
import { TransactionPermissionsDto } from '~/identities/dto/transaction-permissions.dto';

export class PermissionsLikeDto {
  @ApiPropertyOptional({
    description: 'Assets on which to grant permissions. A null value represents full permissions',
    type: AssetPermissionsDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AssetPermissionsDto)
  readonly assets?: AssetPermissionsDto | null;

  @ApiPropertyOptional({
    description:
      'Portfolios on which to grant permissions. A null value represents full permissions',
    type: PortfolioPermissionsDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PortfolioPermissionsDto)
  readonly portfolios?: PortfolioPermissionsDto | null;

  @ApiPropertyOptional({
    description:
      'Transactions that the `secondaryAccount` has permission to execute. A null value represents full permissions. This value should not be passed along with the `transactionGroups`.',
    type: TransactionPermissionsDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TransactionPermissionsDto)
  readonly transactions?: TransactionPermissionsDto | null;

  @ApiPropertyOptional({
    description:
      'Transaction Groups that `secondaryAccount` has permission to execute. This value should not be passed along with the `transactions`.',
    isArray: true,
    enum: TxGroup,
    example: [TxGroup.PortfolioManagement],
  })
  @IsArray()
  @IsEnum(TxGroup, { each: true })
  @IsOptional()
  readonly transactionGroups?: TxGroup[];

  public toPermissionsLike(): PermissionsLike {
    const { assets, portfolios, transactions, transactionGroups } = this;

    let permissionsLike: PermissionsLike = {
      assets: assets === null ? null : assets?.toAssetPermissions(),
      portfolios: portfolios === null ? null : portfolios?.toPortfolioPermissions(),
    };

    if (transactions === null) {
      permissionsLike = { ...permissionsLike, transactions: null };
    } else if (transactions) {
      permissionsLike = {
        ...permissionsLike,
        transactions: transactions.toTransactionPermissions(),
      };
    } else if (transactionGroups) {
      permissionsLike = { ...permissionsLike, transactionGroups };
    }

    return permissionsLike;
  }

  constructor(dto: Omit<PermissionsLikeDto, 'toPermissionLike'>) {
    Object.assign(this, dto);
  }
}
