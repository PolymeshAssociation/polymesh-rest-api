/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KnownNftType } from '@polymeshassociation/polymesh-sdk/types';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';

import { AssetDocumentDto } from '~/assets/dto/asset-document.dto';
import { SecurityIdentifierDto } from '~/assets/dto/security-identifier.dto';
import { IsTicker } from '~/common/decorators/validation';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';
import { CollectionKeyDto } from '~/nfts/dto/collection-key.dto';

export class CreateNftCollectionDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'The name of the Nft Collection',
    example: 'Ticker Collection',
  })
  @IsString()
  readonly name: string;

  @ApiProperty({
    description:
      'The ticker of the NFT Collection. This must either be free or reserved by the Signer',
    example: 'TICKER',
  })
  @IsTicker()
  readonly ticker: string;

  @ApiProperty({
    description: 'The type of Asset',
    example: KnownNftType.Derivative,
  })
  @IsEnum(KnownNftType)
  readonly nftType: KnownNftType;

  @ApiPropertyOptional({
    description: "List of the NFT Collection's Security Identifiers",
    isArray: true,
    type: SecurityIdentifierDto,
  })
  @ValidateNested({ each: true })
  @Type(() => SecurityIdentifierDto)
  readonly securityIdentifiers?: SecurityIdentifierDto[];

  @ApiPropertyOptional({
    description: 'Documents related to the NFT Collection',
    isArray: true,
    type: AssetDocumentDto,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AssetDocumentDto)
  readonly documents?: AssetDocumentDto[];

  @ApiProperty({
    description:
      'The metadata keys that define the collection. Every token issued for the collection must have a value for each key specified',
    isArray: true,
    type: CollectionKeyDto,
  })
  @ValidateNested({ each: true })
  @Type(() => CollectionKeyDto)
  readonly collectionKeys: CollectionKeyDto[];
}
