/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class UpdateVenueSignersDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'List of signers to be added/removed from the Venue',
    type: 'string',
    isArray: true,
    example: ['5GwwYnwCYcJ1Rkop35y7SDHAzbxrCkNUDD4YuCUJRPPXbvyV'],
  })
  @IsString({ each: true })
  readonly signers: string[];
}
