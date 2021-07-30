/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { VenueType } from '@polymathnetwork/polymesh-sdk/types';
import { IsString } from 'class-validator';

import { SignerDto } from '~/common/dto/signer.dto';

export class CreateVenueDto extends SignerDto {
  @ApiProperty({
    description: 'A description of the venue',
    example: 'A place to exchange commodity Assets',
  })
  @IsString()
  readonly description: string;

  @ApiProperty({
    description: 'The type of venue this is',
    enum: VenueType,
    example: VenueType.Exchange,
  })
  @IsString()
  readonly type: VenueType;
}
