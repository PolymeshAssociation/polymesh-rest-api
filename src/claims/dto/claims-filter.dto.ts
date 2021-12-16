/* istanbul ignore file */

import { ClaimType } from '@polymathnetwork/polymesh-sdk/types';
import { IsEnum, IsOptional } from 'class-validator';

import { IncludeExpiredFilterDto } from '~/common/dto/params.dto';

export class ClaimsFilterDto extends IncludeExpiredFilterDto {
  @IsEnum(ClaimType, { each: true })
  @IsOptional()
  readonly claimTypes?: Exclude<ClaimType, ClaimType.InvestorUniquenessV2>[];
}
