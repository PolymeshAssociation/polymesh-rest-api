/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SignerDetailsDto {
  @ApiProperty({
    description:
      'The value to be used in the `signer` field. The format depends on what signer is being used',
  })
  @IsString()
  readonly signer: string;
}
