/* istanbul ignore file */

import { MetadataType } from '@polymeshassociation/polymesh-sdk/types';
import { IsEnum } from 'class-validator';

import { IsAsset } from '~/common/decorators/validation';
import { IdParamsDto } from '~/common/dto/id-params.dto';

export class MetadataParamsDto extends IdParamsDto {
  @IsAsset()
  readonly asset: string;

  @IsEnum(MetadataType)
  readonly type: MetadataType;
}
