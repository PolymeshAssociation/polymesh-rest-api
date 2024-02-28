/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class DecryptBalanceDto {
  @ApiProperty({
    description: 'Encrypted balance',
    example:
      '0x46247c432a2632d23644aab44da0457506cbf7e712cea7158eeb4324f932161b54b44b6e87ca5028099745482c1ef3fc9901ae760a08f925c8e68c1511f6f77e',
    type: 'string',
  })
  @IsString()
  readonly encryptedValue: string;
}
