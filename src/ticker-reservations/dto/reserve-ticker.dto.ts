/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { IsTicker } from '~/common/decorators/validation';
import { SignerDto } from '~/common/dto/signer.dto';

export class ReserveTickerDto extends SignerDto {
  @ApiProperty({
    type: 'string',
    description: 'Ticker to be reserved',
    example: 'TICKER',
  })
  @IsTicker()
  readonly ticker: string;
}
