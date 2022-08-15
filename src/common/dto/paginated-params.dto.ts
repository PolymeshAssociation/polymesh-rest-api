/* istanbul ignore file */

import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { IsOptional, ValidateIf } from 'class-validator';

import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';

export class PaginatedParamsDto {
  @ValidateIf(({ start }: PaginatedParamsDto) => !!start)
  @IsBigNumber({
    max: 30,
  })
  @ToBigNumber()
  readonly size: BigNumber = new BigNumber(10);

  @IsOptional()
  readonly start?: string | BigNumber;
}
