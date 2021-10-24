/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SignerDto {
  @ApiProperty({
    description: 'Identitfier of the key that will sign the transaction',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @IsString()
  readonly signer: string;
}
