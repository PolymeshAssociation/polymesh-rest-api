/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { TxTag } from '@polymathnetwork/polymesh-sdk/types';
import { ArrayNotEmpty, IsArray, IsOptional } from 'class-validator';

import { IsTxTag, IsTxTagOrModuleName } from '~/common/decorators/validation';
import { PermissionTypeDto } from '~/identities/dto/permission-type.dto';

export class TransactionPermissionsDto extends PermissionTypeDto {
  @ApiProperty({
    isArray: true,
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsTxTagOrModuleName({ each: true })
  readonly values: TxTag[];

  @IsArray()
  @ArrayNotEmpty()
  @IsTxTag({ each: true })
  @IsOptional()
  readonly exceptions?: TxTag[];
}
