/* istanbul ignore file */

import { AuthorizationType } from '@polymathnetwork/polymesh-sdk/types';
import { IsEnum, IsOptional } from 'class-validator';

import { IncludeExpiredDto } from '~/common/dto/params.dto';

export class AuthorizationsFilterDto extends IncludeExpiredDto {
  @IsEnum(AuthorizationType)
  @IsOptional()
  readonly type?: AuthorizationType;
}
