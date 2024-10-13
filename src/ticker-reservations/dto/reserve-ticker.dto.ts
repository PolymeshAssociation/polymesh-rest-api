/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { IsAsset } from '~/common/decorators/validation';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class ReserveTickerDto extends TransactionBaseDto {
  @ApiProperty({
    type: 'string',
    description: 'Ticker to be reserved',
    example: 'TICKER',
  })
  @IsAsset()
  readonly ticker: string;
}
