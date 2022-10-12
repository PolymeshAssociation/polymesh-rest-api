/* istanbul ignore file */

import { AuthorizationType } from '@polymeshassociation/polymesh-sdk/types';
import { IsEnum, IsOptional } from 'class-validator';

import { IncludeExpiredFilterDto } from '~/common/dto/params.dto';

export class AuthorizationsFilterDto extends IncludeExpiredFilterDto {
  @IsEnum(AuthorizationType)
  @IsOptional()
  readonly type?: AuthorizationType;
}
