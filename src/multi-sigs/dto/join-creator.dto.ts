/* istanbul ignore file */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, ValidateNested } from 'class-validator';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { IsPermissionsLike } from '~/identities/decorators/validation';
import { PermissionsLikeDto } from '~/identities/dto/permissions-like.dto';

export class JoinCreatorDto extends TransactionBaseDto {
  @ApiPropertyOptional({
    description: 'Whether or not to join the creator as the new primary key',
    type: 'boolean',
  })
  @IsOptional()
  @IsBoolean()
  readonly asPrimary?: boolean;

  @ApiPropertyOptional({
    description: 'Permissions to be granted to the multiSig if joining as a `secondaryAccount`',
    type: PermissionsLikeDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PermissionsLikeDto)
  @IsPermissionsLike()
  readonly permissions?: PermissionsLikeDto;
}
