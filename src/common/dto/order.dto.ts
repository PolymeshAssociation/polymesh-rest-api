/* istanbul ignore file */

import { Order } from '@polymathnetwork/polymesh-sdk/types';
import { IsEnum, IsOptional } from 'class-validator';

export class OrderDto {
  @IsEnum(Order)
  @IsOptional()
  readonly order: Order = Order.Asc;
}
