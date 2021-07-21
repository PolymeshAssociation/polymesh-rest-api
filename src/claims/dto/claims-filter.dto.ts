import { ClaimType } from '@polymathnetwork/polymesh-sdk/types';
import { IsEnum, IsOptional } from 'class-validator';

export class ClaimsFilterDto {
  @IsEnum(ClaimType, { each: true })
  @IsOptional()
  readonly claimTypes?: Exclude<ClaimType, ClaimType.InvestorUniquenessV2>[];
}
