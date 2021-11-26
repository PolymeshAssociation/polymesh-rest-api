/* istanbul ignore file */

import { IsTicker } from '~/common/decorators/validation';
import { IdParamsDto } from '~/common/dto/id-params.dto';
export class GetCheckPointParamsDto extends IdParamsDto {
  @IsTicker()
  readonly ticker: string;
}
