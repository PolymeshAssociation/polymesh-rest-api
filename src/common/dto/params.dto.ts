/* istanbul ignore file */

import { IsBoolean, IsOptional } from 'class-validator';

import { IsDid } from '~/common/decorators/validation';

export class DidDto {
  @IsDid()
  readonly did: string;
}

export class IncludeExpiredFilterDto {
  @IsBoolean()
  @IsOptional()
  readonly includeExpired?: boolean = true;
}
