/* istanbul ignore file */

import { IsDid } from '~/common/decorators/validation';
import { IdParamsDto } from '~/common/dto/id-params.dto';

export class AuthorizationParamsDto extends IdParamsDto {
  @IsDid()
  readonly did: string;
}
