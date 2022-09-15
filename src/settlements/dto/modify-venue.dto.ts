/* istanbul ignore file */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { VenueType } from '@polymeshassociation/polymesh-sdk/types';
import { IsEnum, IsString, ValidateIf } from 'class-validator';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class ModifyVenueDto extends TransactionBaseDto {
  @ApiPropertyOptional({
    description: 'Details about the Venue',
    example: 'The TSX is an exchange located in Toronto, Ontario',
  })
  @ValidateIf(({ type, description }: ModifyVenueDto) => !type || !!description)
  @IsString()
  readonly description?: string;

  @ApiPropertyOptional({
    description: 'The type of Venue',
    enum: VenueType,
    example: VenueType.Exchange,
  })
  @ValidateIf(({ type, description }: ModifyVenueDto) => !!type || !description)
  @IsEnum(VenueType)
  readonly type?: VenueType;
}
