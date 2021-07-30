/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { VenueType } from '@polymathnetwork/polymesh-sdk/types';
import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';

import { SignerDto } from '~/common/dto/signer.dto';

export class ModifyVenueDto extends SignerDto {
  @ApiProperty({
    description: 'Details about the Venue',
    example: 'The TSX is an exchange located in Toronto, Ontario',
  })
  @IsOptional()
  @ValidateIf(({ type, description }: ModifyVenueDto) => !type || !!description)
  @IsString()
  readonly description?: string;

  @ApiProperty({
    description: 'The type of Venue',
    enum: VenueType,
    example: VenueType.Exchange,
  })
  @ValidateIf(({ type, description }: ModifyVenueDto) => !!type || !description)
  @IsEnum(VenueType)
  readonly type?: VenueType;
}
