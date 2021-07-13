import { AuthorizationType, ClaimType } from '@polymathnetwork/polymesh-sdk/types';
import { IsEnum, IsOptional } from 'class-validator';

import { IsDid } from '~/common/decorators/validation';

export class DidParams {
  @IsDid()
  readonly did: string;
}

export class AuthorizationTypeParams {
  @IsEnum(AuthorizationType)
  @IsOptional()
  readonly type?: AuthorizationType;
}

export class ClaimTypeParams {
  @IsEnum(ClaimType, { each: true })
  @IsOptional()
  readonly claimTypes?: Exclude<ClaimType, ClaimType.InvestorUniquenessV2>[];
}
