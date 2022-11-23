/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateIf, ValidateNested } from 'class-validator';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { MetadataSpecDto } from '~/metadata/dto/metadata-spec.dto';
import { MetadataValueDetailsDto } from '~/metadata/dto/metadata-value-details.dto';

export class CreateMetadataDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'Name of the Asset Metadata',
    example: 'Maturity',
  })
  @IsString()
  readonly name: string;

  @ApiProperty({
    description: 'Details about the Asset Metadata',
    type: MetadataSpecDto,
  })
  @ValidateNested()
  @Type(() => MetadataSpecDto)
  readonly specs: MetadataSpecDto;

  @ApiPropertyOptional({
    description: 'Value for the Asset Metadata',
    type: 'string',
    example: 'SOME_VALUE',
  })
  @ValidateIf(({ details, value }: CreateMetadataDto) => !!value || !!details)
  @IsString()
  readonly value?: string;

  @ApiPropertyOptional({
    description: 'Details about the Asset Metadata value',
    type: MetadataValueDetailsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MetadataValueDetailsDto)
  readonly details?: MetadataValueDetailsDto;
}
