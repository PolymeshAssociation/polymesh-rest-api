import { ApiProperty } from '@nestjs/swagger';

import { IsDid } from '~/common/decorators/validation';

export class IdentityDto {
  @ApiProperty({
    description: 'DID of the Identity',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @IsDid()
  did: string;
}
