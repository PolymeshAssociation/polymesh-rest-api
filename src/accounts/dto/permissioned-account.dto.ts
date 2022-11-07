/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, ValidateNested } from 'class-validator';

import { IsPermissionsLike } from '~/identities/decorators/validation';
import { PermissionsLikeDto } from '~/identities/dto/permissions-like.dto';

export class PermissionedAccountDto {
  @ApiProperty({
    description: 'Account address',
    example: '5GwwYnwCYcJ1Rkop35y7SDHAzbxrCkNUDD4YuCUJRPPXbvyV',
  })
  @IsString()
  readonly secondaryAccount: string;

  @ApiProperty({
    description: 'Permissions to be granted to the `secondaryAccount`',
    type: PermissionsLikeDto,
  })
  @ValidateNested()
  @Type(() => PermissionsLikeDto)
  @IsPermissionsLike()
  readonly permissions: PermissionsLikeDto;

  constructor(dto: PermissionedAccountDto) {
    Object.assign(this, dto);
  }
}
