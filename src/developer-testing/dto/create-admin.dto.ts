/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class CreateCddProviders {
  @ApiProperty({
    description: 'The addresses to create identities for and make CDD providers',
    type: 'string',
    isArray: true,
    example: ['5GwwYnwCYcJ1Rkop35y7SDHAzbxrCkNUDD4YuCUJRPPXbvyV'],
  })
  @IsArray()
  readonly addresses: string[];

  constructor(dto: CreateCddProviders) {
    Object.assign(this, dto);
  }
}
