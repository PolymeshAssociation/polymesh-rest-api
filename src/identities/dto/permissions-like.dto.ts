/* istanbul ignore file */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { TxGroup } from '@polymathnetwork/polymesh-sdk/types';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNotEmptyObject,
  IsOptional,
  ValidateNested,
} from 'class-validator';

import { TransactionPermissionsDto } from '~/identities/dto/transaction-permissions.dto';

import { AssetSectionPermissionDto } from './asset-section-permission.dto';
import { PortfolioSectionPermissionDto } from './portfolio-section-permission.dto';

export class PermissionsLikeDto {
  @ApiPropertyOptional({
    type: AssetSectionPermissionDto,
  })
  @IsOptional()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => AssetSectionPermissionDto)
  readonly tokens?: AssetSectionPermissionDto;

  @ApiPropertyOptional({
    type: PortfolioSectionPermissionDto,
  })
  @IsOptional()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => PortfolioSectionPermissionDto)
  readonly portfolios?: PortfolioSectionPermissionDto;

  @ApiPropertyOptional({
    type: TransactionPermissionsDto,
  })
  @IsOptional()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => TransactionPermissionsDto)
  readonly transactions?: TransactionPermissionsDto;

  @ApiPropertyOptional({
    description:
      'Transaction Groups that the Secondary Key has permission to execute. A null value represents full permissions',
    isArray: true,
    enum: TxGroup,
    example: [TxGroup.PortfolioManagement],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(TxGroup, { each: true })
  @IsOptional()
  readonly transactionGroups?: TxGroup[];
}
