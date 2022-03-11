/* istanbul ignore file */

import {
  OfferingBalanceStatus,
  OfferingSaleStatus,
  OfferingTimingStatus,
} from '@polymathnetwork/polymesh-sdk/types';
import { IsEnum, IsOptional } from 'class-validator';

export class OfferingStatusFilterDto {
  @IsEnum(OfferingTimingStatus)
  @IsOptional()
  readonly timing?: OfferingTimingStatus;

  @IsEnum(OfferingBalanceStatus)
  @IsOptional()
  readonly balance?: OfferingBalanceStatus;

  @IsEnum(OfferingSaleStatus)
  @IsOptional()
  readonly sale?: OfferingSaleStatus;
}
