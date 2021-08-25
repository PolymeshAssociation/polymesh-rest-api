/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { VenueType } from '@polymathnetwork/polymesh-sdk/types';
import { IsEnum, IsString } from 'class-validator';

import { SignerDto } from '~/common/dto/signer.dto';

export class CreateVenueDto extends SignerDto {
  @ApiProperty({
    description: 'Description of the venue',
    example: 'A place to exchange commodity Assets',
  })
  @IsString()
  readonly details: string;

  @ApiProperty({
    description: 'Type of venue this is',
    enum: VenueType,
    example: VenueType.Exchange,
  })
  @IsEnum(VenueType)
  readonly type: VenueType;
}
