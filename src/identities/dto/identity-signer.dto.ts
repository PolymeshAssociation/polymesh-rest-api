/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { IsDid } from '~/common/decorators/validation';
import { SignerTypeDto } from '~/identities/dto/signer-type.dto';

export class IdentitySignerDto extends SignerTypeDto {
  @ApiProperty({
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
    description: 'Unique Identity identifier (DID: Decentralized IDentity)',
  })
  @IsDid()
  readonly did: string;
}
