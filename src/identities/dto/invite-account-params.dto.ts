/* istanbul ignore file */

import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmptyObject, IsOptional, ValidateNested } from 'class-validator';

import { SignerDto } from '~/common/dto/signer.dto';
import { AccountSignerDto } from '~/identities/dto/account-signer.dto';
import { IdentitySignerDto } from '~/identities/dto/identity-signer.dto';
import { PermissionTypeDto } from '~/identities/dto/permission-type.dto';
import { PermissionsLikeDto } from '~/identities/dto/permissions-like.dto';
import { SignerTypeDto } from '~/identities/dto/signer-type.dto';

import { AssetSectionPermissionDto } from './asset-section-permission.dto';

@ApiExtraModels(AccountSignerDto, IdentitySignerDto, AssetSectionPermissionDto, PermissionTypeDto)
export class InviteAccountParamsDto extends SignerDto {
  @ApiProperty({
    description: 'Identity or Account to be invited',
    oneOf: [{ $ref: getSchemaPath(AccountSignerDto) }, { $ref: getSchemaPath(IdentitySignerDto) }],
    discriminator: {
      propertyName: 'signerType',
    },
  })
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => SignerTypeDto, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'signerType',
      subTypes: [
        { value: AccountSignerDto, name: 'Account' },
        { value: IdentitySignerDto, name: 'Identity' },
      ],
    },
  })
  readonly targetAccount: AccountSignerDto | IdentitySignerDto;

  @ApiProperty({
    description: 'Permissions to grant to a Signer over an Identity',
    type: () => PermissionsLikeDto,
  })
  @ValidateNested()
  @Type(() => PermissionsLikeDto)
  @IsOptional()
  readonly permissions?: PermissionsLikeDto;

  @ApiPropertyOptional({
    description: 'The expiry',
    example: new Date('05/23/2021').toISOString(),
    type: 'string',
  })
  @IsOptional()
  @IsDate()
  readonly expiry?: Date;
}
