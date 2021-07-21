/** istanbul ignore file */

import { ClaimType } from '@polymathnetwork/polymesh-sdk/types';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

import { IsDid } from '~/common/decorators/validation';

export class DidDto {
  @IsDid()
  readonly did: string;
}

export class ClaimTypeDto {
  @IsEnum(ClaimType, { each: true })
  @IsOptional()
  readonly claimTypes?: Exclude<ClaimType, ClaimType.InvestorUniquenessV2>[];
}

export class IncludeExpiredDto {
  @IsBoolean()
  @IsOptional()
  readonly includeExpired?: boolean = true;
}
