/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { MetadataValueDto } from '~/nfts/dto/metadata-value.dto';

export class IssueNftDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'The metadata values for the token',
    type: MetadataValueDto,
    isArray: true,
  })
  @Type(() => MetadataValueDto)
  @ValidateNested({ each: true })
  readonly metadata: MetadataValueDto[];
}
