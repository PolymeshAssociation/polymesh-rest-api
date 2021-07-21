/* istanbul ignore file */

import { AuthorizationType } from '@polymathnetwork/polymesh-sdk/types';
import { IsEnum, IsOptional } from 'class-validator';

import { IncludeExpiredFilterDto } from '~/common/dto/params.dto';

export class AuthorizationsFilterDto extends IncludeExpiredFilterDto {
  @IsEnum(AuthorizationType)
  @IsOptional()
  readonly type?: AuthorizationType;
}
