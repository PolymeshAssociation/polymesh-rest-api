/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { SectionPermissions } from '@polymathnetwork/polymesh-sdk/types';
import { ArrayNotEmpty, IsArray } from 'class-validator';

import { IsTicker } from '~/common/decorators/validation';
import { PermissionTypeDto } from '~/identities/dto/permission-type.dto';

export class AssetSectionPermissionDto extends PermissionTypeDto {
  @ApiProperty({
    description: 'List of assets to be included or excluded in the permissions',
    type: 'string',
    isArray: true,
    example: ['TICKER123456'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsTicker({ each: true })
  readonly values: string[];

  public toSectionPermissions(): SectionPermissions<string> | null {
    const { values, type } = this;

    if (type) {
      return {
        values,
        type,
      };
    }

    return null;
  }

  constructor(dto: Omit<AssetSectionPermissionDto, 'toSectionPermissions'>) {
    super();
    Object.assign(this, dto);
  }
}
