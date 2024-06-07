/* istanbul ignore file */

import { IsDate, IsOptional } from 'class-validator';

export class PeriodQueryDto {
  @IsOptional()
  @IsDate()
  readonly start?: Date;

  @IsOptional()
  @IsDate()
  readonly end?: Date;
}
