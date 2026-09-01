/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

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

  @ApiPropertyOptional({
    description:
      "Issues the NFT to this Account's asset holdings instead of a Portfolio. Must be the signing Account - any other value is rejected. When omitted, the NFT is issued to the signer's default portfolio",
    example: '5EjsqfmY4JqMSrt7YQCe3if5DK4FrG98uUwZsaXmNW7aKdNM',
  })
  @IsOptional()
  @IsString()
  readonly account?: string;
}
