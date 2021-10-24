/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { SignerTypeDto } from '~/identities/dto/signer-type.dto';

export class AccountSignerDto extends SignerTypeDto {
  @ApiProperty({
    description: 'Address of the account',
    type: 'string',
    example: '5DZp1QYH49MKZhCtDupNaAeHp8xtqetuSzgf2p2cUWoxW3iu',
  })
  @IsString()
  readonly address: string;
}
