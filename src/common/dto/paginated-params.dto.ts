/* istanbul ignore file */

import { IsNumber, IsOptional, Max, ValidateIf } from 'class-validator';

export class PaginatedParamsDto {
  @ValidateIf(({ start }: PaginatedParamsDto) => !!start)
  @IsNumber()
  @Max(30)
  readonly size: number = 10;

  @IsOptional()
  readonly start?: string | number;
}
