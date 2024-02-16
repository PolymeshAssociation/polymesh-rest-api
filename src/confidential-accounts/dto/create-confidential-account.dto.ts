/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class CreateConfidentialAccountDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'Public key of the Confidential Account',
    type: 'string',
    example: '0x',
  })
  @IsString()
  readonly publicKey: string;
}
