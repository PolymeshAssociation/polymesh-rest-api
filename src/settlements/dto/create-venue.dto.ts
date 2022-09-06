/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { VenueType } from '@polymeshassociation/polymesh-sdk/types';
import { IsEnum, IsString } from 'class-validator';

import { TransactionBaseDto } from '~/common/dto/signer.dto';

export class CreateVenueDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'Description of the Venue',
    example: 'A place to exchange commodity Assets',
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
}
