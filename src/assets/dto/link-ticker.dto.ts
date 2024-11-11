/* istanbul ignore file */
import { ApiProperty } from '@nestjs/swagger';

import { IsTicker } from '~/common/decorators/validation';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class LinkTickerDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'Ticker to be linked with the Asset',
    example: 'TICKER',
    type: 'string',
  })
  @IsTicker()
  readonly ticker: string;
}
