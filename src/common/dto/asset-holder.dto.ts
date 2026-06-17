/* istanbul ignore file */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { AssetHolderLike } from '@polymeshassociation/polymesh-sdk/types';
import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber, IsDid } from '~/common/decorators/validation';
import { AppValidationError } from '~/common/errors';
import { toPortfolioId } from '~/portfolios/portfolios.util';

export enum AssetHolderType {
  account = 'account',
  portfolio = 'portfolio',
}

export class AssetHolderDto {
  @ApiPropertyOptional({
    description:
      'Type of asset holder. When omitted, a portfolio holder is assumed if `did` and `id` are provided',
    enum: AssetHolderType,
    example: AssetHolderType.portfolio,
  })
  @IsOptional()
  @IsEnum(AssetHolderType)
  readonly type?: AssetHolderType;

  @ApiPropertyOptional({
    description: 'Account address when the holder is an Account',
    example: '5EjsqfmY4JqMSrt7YQCe3if5DK4FrG98uUwZsaXmNW7aKdNM',
  })
  @ValidateIf(o => o.type === AssetHolderType.account || (!o.did && !o.id))
  @IsString()
  readonly address?: string;

  @ApiPropertyOptional({
    description: 'DID of the portfolio owner when the holder is a Portfolio',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @ValidateIf(
    o => o.type === AssetHolderType.portfolio || (!o.address && o.type !== AssetHolderType.account)
  )
  @IsDid()
  readonly did?: string;

  @ApiPropertyOptional({
    description: 'Portfolio number. Use 0 for the Default Portfolio',
    example: '0',
    type: 'string',
  })
  @ValidateIf(
    o => o.type === AssetHolderType.portfolio || (!o.address && o.type !== AssetHolderType.account)
  )
  @IsBigNumber()
  @ToBigNumber()
  readonly id?: BigNumber;

  public toAssetHolderLike(): AssetHolderLike {
    const holderType = this.resolveType();

    if (holderType === AssetHolderType.account) {
      if (!this.address) {
        throw new AppValidationError('Account address is required for an account asset holder');
      }
      return this.address;
    }

    if (!this.did || this.id === undefined) {
      throw new AppValidationError(
        'Portfolio DID and id are required for a portfolio asset holder'
      );
    }

    const portfolioId = toPortfolioId(this.id);
    if (portfolioId) {
      return {
        identity: this.did,
        id: portfolioId,
      };
    }

    return this.did;
  }

  private resolveType(): AssetHolderType {
    if (this.type) {
      return this.type;
    }

    if (this.address && !this.did && this.id === undefined) {
      return AssetHolderType.account;
    }

    if (this.did !== undefined && this.id !== undefined) {
      return AssetHolderType.portfolio;
    }

    throw new AppValidationError(
      'Asset holder must specify either an account address or a portfolio DID and id'
    );
  }

  constructor(dto: Omit<AssetHolderDto, 'toAssetHolderLike' | 'resolveType'>) {
    Object.assign(this, dto);
  }
}
