/** istanbul ignore file */

import { AuthorizationType, ClaimType } from '@polymathnetwork/polymesh-sdk/types';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

import { IsDid } from '~/common/decorators/validation';

export class DidDto {
  @IsDid()
  readonly did: string;
}

export class AuthorizationTypeDto {
  @IsEnum(AuthorizationType)
  @IsOptional()
  readonly type?: AuthorizationType;
}

export class AuthorizationsFilterDto {
  @IsBoolean()
  @IsOptional()
  readonly includeExpired?: boolean;
}
