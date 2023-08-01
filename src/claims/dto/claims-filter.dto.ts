/* istanbul ignore file */

import { ClaimType } from '@polymeshassociation/polymesh-sdk/types';
import { IsEnum, IsOptional } from 'class-validator';

import { IncludeExpiredFilterDto } from '~/common/dto/params.dto';

export class ClaimsFilterDto extends IncludeExpiredFilterDto {
  @IsEnum(ClaimType, { each: true })
  @IsOptional()
  readonly claimTypes?: ClaimType[];
}
