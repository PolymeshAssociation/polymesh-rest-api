/* istanbul ignore file */

import { IsNumber, IsOptional, Max } from 'class-validator';

export class PaginatedParamsDto {
  @IsNumber()
  @IsOptional()
  @Max(30)
  readonly size: number = 10;

  @IsOptional()
  readonly start?: string | number;
}
