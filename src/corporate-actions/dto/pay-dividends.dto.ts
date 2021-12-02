import { ApiProperty } from '@nestjs/swagger';

import { SignerDto } from '~/common/dto/signer.dto';

export class PayDividendsDto extends SignerDto {
  @ApiProperty({
    description: 'DIDs of the target identities',
    type: 'string',
    isArray: true,
    example: [
      '0x0600000000000000000000000000000000000000000000000000000000000000',
      '0x0611111111111111111111111111111111111111111111111111111111111111',
    ],
  })
  readonly targets: string[];
}
