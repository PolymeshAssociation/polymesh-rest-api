/* istanbul ignore file */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { PermissionsLike, TxGroup } from '@polymathnetwork/polymesh-sdk/types';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, ValidateNested } from 'class-validator';

import { TransactionPermissionsDto } from '~/identities/dto/transaction-permissions.dto';

import { AssetSectionPermissionDto } from './asset-section-permission.dto';
import { PortfolioSectionPermissionDto } from './portfolio-section-permission.dto';

export class PermissionsLikeDto {
  @ApiPropertyOptional({
    description:
      'Security Tokens on which to grant permissions. A null value represents full permissions',
    type: AssetSectionPermissionDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AssetSectionPermissionDto)
  readonly tokens?: AssetSectionPermissionDto | null;

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
      'Transactions that the `targetAccount` has permission to execute. A null value represents full permissions. This value should not be passed along with the `transactionGroups`.',
    type: TransactionPermissionsDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TransactionPermissionsDto)
  readonly transactions?: TransactionPermissionsDto | null;

  @ApiPropertyOptional({
    description:
      'Transaction Groups that `targetAccount` has permission to execute. A null value represents full permissions. This value should not be passed along with the `transactions`.',
    isArray: true,
    enum: TxGroup,
    example: [TxGroup.PortfolioManagement],
  })
  @IsArray()
  @IsEnum(TxGroup, { each: true })
  @IsOptional()
  readonly transactionGroups?: TxGroup[];

  public toPermissionsLike(): PermissionsLike {
    const { tokens, portfolios, transactions, transactionGroups } = this;

    let permissionLike: PermissionsLike = {
      tokens: tokens == null ? null : tokens.toSectionPermissions(),
      portfolios: portfolios == null ? null : portfolios?.toSectionPermissions(),
    };

    if (transactions === null) {
      permissionLike = { ...permissionLike, transactions: null };
    } else if (transactions) {
      permissionLike = { ...permissionLike, transactions: transactions.toTransactionPermissions() };
    } else if (transactionGroups) {
      permissionLike = { ...permissionLike, transactionGroups };
    }

    return permissionLike;
  }

  constructor(dto: Omit<PermissionsLikeDto, 'toPermissionLike'>) {
    Object.assign(this, dto);
  }
}
