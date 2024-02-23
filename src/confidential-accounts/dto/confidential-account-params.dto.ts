/* istanbul ignore file */

import { IsString } from 'class-validator';

export class ConfidentialAccountParamsDto {
  @IsString()
  readonly confidentialAccount: string;
}
