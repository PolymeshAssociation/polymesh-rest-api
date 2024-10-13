/* istanbul ignore file */

import { IsAsset } from '~/common/decorators/validation';
import { IdParamsDto } from '~/common/dto/id-params.dto';

export class CheckpointParamsDto extends IdParamsDto {
  @IsAsset()
  readonly ticker: string;
}
