/* istanbul ignore file */

import { MetadataType } from '@polymeshassociation/polymesh-sdk/types';
import { IsEnum } from 'class-validator';

import { IsTicker } from '~/common/decorators/validation';
import { IdParamsDto } from '~/common/dto/id-params.dto';

export class MetadataParamsDto extends IdParamsDto {
  @IsTicker()
  readonly ticker: string;

  @IsEnum(MetadataType)
  readonly type: MetadataType;
}
