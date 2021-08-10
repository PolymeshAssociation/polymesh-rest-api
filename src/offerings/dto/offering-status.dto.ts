/* istanbul ignore file */

import {
  StoBalanceStatus,
  StoSaleStatus,
  StoTimingStatus,
} from '@polymathnetwork/polymesh-sdk/types';
import { IsEnum, IsOptional } from 'class-validator';

export class OfferingStatusDto {
  @IsEnum(StoTimingStatus)
  @IsOptional()
  readonly timing?: StoTimingStatus;

  @IsEnum(StoBalanceStatus)
  @IsOptional()
  readonly balance?: StoBalanceStatus;

  @IsEnum(StoSaleStatus)
  @IsOptional()
  readonly sale?: StoSaleStatus;
}
