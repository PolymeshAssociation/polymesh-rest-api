/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SignerDto {
  @ApiProperty({
    description: 'An Identifier for the account that is to sign the transaction',
    example: 'alice',
  })
  @IsString()
  readonly signer: string;
}
