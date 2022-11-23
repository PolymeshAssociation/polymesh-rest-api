/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, ValidateIf, ValidateNested } from 'class-validator';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { MetadataValueDetailsDto } from '~/metadata/dto/metadata-value-details.dto';

export class SetMetadataDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'Value for the Asset Metadata',
    type: 'string',
    example: 'SOME_VALUE',
  })
  @ValidateIf(({ value }: SetMetadataDto) => !!value)
  @IsString()
  readonly value?: string;

  @ApiPropertyOptional({
    description:
      'Details about the Asset Metadata value which includes expiry and lock status of the `value`',
    type: MetadataValueDetailsDto,
  })
  @ValidateIf(({ details }: SetMetadataDto) => !!details)
  @ValidateNested()
  @Type(() => MetadataValueDetailsDto)
  readonly details?: MetadataValueDetailsDto;
}
