/* istanbul ignore file */

import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { IsOptional, Max, ValidateIf } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';

export class PaginatedParamsDto {
  @ValidateIf(({ start }: PaginatedParamsDto) => !!start)
  @IsBigNumber()
  @ToBigNumber()
  @Max(30)
  readonly size: BigNumber = new BigNumber(10);

  @IsOptional()
  readonly start?: string | BigNumber;
}
