/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, ValidateNested } from 'class-validator';

import { SignerDto } from '~/common/dto/signer.dto';
import { PermissionsLikeDto } from '~/identities/dto/permissions-like.dto';

export class InviteAccountParamsDto extends SignerDto {
  @ApiProperty({
    description: 'Account address to be invited',
    example: '5GwwYnwCYcJ1Rkop35y7SDHAzbxrCkNUDD4YuCUJRPPXbvyV',
  })
  @IsString()
  readonly targetAccount: string;

  @ApiProperty({
    description: 'Permissions to be granted to the `targetAccount`',
    type: () => PermissionsLikeDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PermissionsLikeDto)
  readonly permissions?: PermissionsLikeDto;

  @ApiPropertyOptional({
    description: 'Expiry date of the `permissions`',
    example: new Date('05/23/2021').toISOString(),
    type: 'string',
  })
  @IsOptional()
  @IsDate()
  readonly expiry?: Date;
}
