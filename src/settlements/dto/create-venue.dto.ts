/* istanbul ignore file */
import { ApiProperty } from '@nestjs/swagger';
import { VenueType } from '@polymeshassociation/polymesh-sdk/types';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class CreateVenueDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'Description of the Venue',
    example: 'A place to exchange Assets',
  })
  @IsString()
  readonly description: string;

  @ApiProperty({
    description: 'The type of Venue',
    enum: VenueType,
    example: VenueType.Exchange,
  })
  @IsEnum(VenueType)
  readonly type: VenueType;

  @ApiProperty({
    description:
      'Optional list of signers to be allowed to sign off chain receipts for instructions in this Venue',
    type: 'string',
    isArray: true,
    example: ['5GwwYnwCYcJ1Rkop35y7SDHAzbxrCkNUDD4YuCUJRPPXbvyV'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly signers?: string[];
}
