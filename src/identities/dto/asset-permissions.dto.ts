/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { SectionPermissions } from '@polymeshassociation/polymesh-sdk/types';
import { IsArray } from 'class-validator';

import { IsAsset } from '~/common/decorators/validation';
import { PermissionTypeDto } from '~/identities/dto/permission-type.dto';

export class AssetPermissionsDto extends PermissionTypeDto {
  @ApiProperty({
    description: 'List of assets to be included or excluded in the permissions',
    type: 'string',
    isArray: true,
    example: ['3616b82e-8e10-80ae-dc95-2ea28b9db8b3'],
  })
  @IsArray()
  @IsAsset({ each: true })
  readonly values: string[];

  public toAssetPermissions(): SectionPermissions<string> | null {
    const { values, type } = this;

    return {
      values,
      type,
    };
  }

  constructor(dto: Omit<AssetPermissionsDto, 'toAssetPermissions'>) {
    super();
    Object.assign(this, dto);
  }
}
