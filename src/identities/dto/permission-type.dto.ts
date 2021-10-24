/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { PermissionType } from '@polymathnetwork/polymesh-sdk/types';
import { IsEnum } from 'class-validator';

export class PermissionTypeDto {
  @ApiProperty({
    description: 'Indicates whether the permissions are inclusive or exclusive',
    example: PermissionType.Include,
    enum: PermissionType,
    type: 'string',
  })
  @IsEnum(PermissionType)
  readonly type: PermissionType;
}
