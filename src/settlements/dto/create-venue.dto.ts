/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { VenueType } from '@polymathnetwork/polymesh-sdk/types';
import { IsEnum, IsString } from 'class-validator';

import { SignerDto } from '~/common/dto/signer.dto';

export class CreateVenueDto extends SignerDto {
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
