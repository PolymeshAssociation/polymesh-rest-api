/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { SignerDto } from '~/common/dto/signer.dto';

export class ReserveTickerDto extends SignerDto {
  @ApiProperty({
    description: 'The ticker to reserve',
    example: 'BRK.A',
  })
  @IsString()
  readonly ticker: string;
}
