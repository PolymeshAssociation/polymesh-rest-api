/* istanbul ignore file */

import { IsDid, IsTicker } from '~/common/decorators/validation';
import { IdParamsDto } from '~/common/dto/id-params.dto';
export class CheckPointBalanceParamsDto extends IdParamsDto {
  @IsTicker()
  readonly ticker: string;

  @IsDid()
  readonly did: string;
}
