/* istanbul ignore file */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { PermissionsLike, TxGroup } from '@polymathnetwork/polymesh-sdk/types';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, ValidateNested } from 'class-validator';

import { AssetSectionPermissionDto } from '~/identities/dto/asset-section-permission.dto';
import { PortfolioSectionPermissionDto } from '~/identities/dto/portfolio-section-permission.dto';
import { TransactionPermissionsDto } from '~/identities/dto/transaction-permissions.dto';

export class PermissionsLikeDto {
  @ApiPropertyOptional({
    description: 'Assets on which to grant permissions. A null value represents full permissions',
    type: AssetSectionPermissionDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AssetSectionPermissionDto)
  readonly assets?: AssetSectionPermissionDto | null;

  @ApiPropertyOptional({
    description:
      'Portfolios on which to grant permissions. A null value represents full permissions',
    type: PortfolioSectionPermissionDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PortfolioSectionPermissionDto)
  readonly portfolios?: PortfolioSectionPermissionDto | null;

  @ApiPropertyOptional({
    description:
      'Transactions that the `secondaryKey` has permission to execute. A null value represents full permissions. This value should not be passed along with the `transactionGroups`.',
    type: TransactionPermissionsDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TransactionPermissionsDto)
  readonly transactions?: TransactionPermissionsDto | null;

  @ApiPropertyOptional({
    description:
      'Transaction Groups that `secondaryKey` has permission to execute. A null value represents full permissions. This value should not be passed along with the `transactions`.',
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
      tokens: assets == null ? null : assets.toSectionPermissions(),
      portfolios: portfolios == null ? null : portfolios?.toSectionPermissions(),
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
