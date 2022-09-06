/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { IsTicker } from '~/common/decorators/validation';
import { TransactionBaseDto } from '~/common/dto/signer.dto';

export class ReserveTickerDto extends TransactionBaseDto {
  @ApiProperty({
    type: 'string',
    description: 'Ticker to be reserved',
    example: 'TICKER',
  })
  @IsTicker()
  readonly ticker: string;
}
