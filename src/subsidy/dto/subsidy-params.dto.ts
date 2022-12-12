/* istanbul ignore file */

import { IsString } from 'class-validator';

export class SubsidyParamsDto {
  @IsString()
  readonly beneficiary: string;

  @IsString()
  readonly subsidizer: string;
}
