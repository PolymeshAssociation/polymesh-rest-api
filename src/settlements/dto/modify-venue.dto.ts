/* istanbul ignore file */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { VenueType } from '@polymathnetwork/polymesh-sdk/types';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { SignerDto } from '~/common/dto/signer.dto';

export class ModifyVenueDto extends SignerDto {
  @ApiPropertyOptional({
    description: 'Details about the venue',
    example: 'The TSX is an exchange located in Toronto, Ontario',
  })
  @IsOptional()
  @IsString()
  readonly description?: string;

  @ApiPropertyOptional({
    description: 'The type of Venue',
    enum: VenueType,
    example: VenueType.Exchange,
  })
  @IsOptional()
  @IsEnum(VenueType)
  readonly type?: VenueType;
}
