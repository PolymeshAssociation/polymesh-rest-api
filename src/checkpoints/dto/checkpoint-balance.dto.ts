/* istanbul ignore file */

import { IsAsset, IsDid } from '~/common/decorators/validation';
import { IdParamsDto } from '~/common/dto/id-params.dto';

export class CheckPointBalanceParamsDto extends IdParamsDto {
  @IsAsset()
  readonly asset: string;

  @IsDid()
  readonly did: string;
}
