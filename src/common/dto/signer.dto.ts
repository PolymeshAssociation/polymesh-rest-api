import { ApiProperty } from '@nestjs/swagger';

import { IsDid } from '~/common/decorators/validation';

export class SignerDto {
  @ApiProperty({
    description: 'DID of the Identity that will sign the transaction',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @IsDid()
  readonly signer: string;
}
