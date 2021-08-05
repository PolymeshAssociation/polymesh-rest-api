/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import {
  KnownTokenType,
  TokenDocument,
  TokenIdentifier,
  TokenIdentifierType,
} from '@polymathnetwork/polymesh-sdk/types';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';

import { AssetDocumentDto } from '~/assets/dto/asset-document.dto';
import { AssetIdentifierDto } from '~/assets/dto/asset-identifier.dto';
import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber, IsTicker } from '~/common/decorators/validation';
import { SignerDto } from '~/common/dto/signer.dto';

export class CreateAssetDto extends SignerDto {
  @ApiProperty({
    description: 'The name of the Asset',
    example: 'Berkshire Hathaway Inc. Class A',
  })
  @IsString()
  readonly name: string;

  @ApiProperty({
    description: 'The ticker of the Asset. This must already be reserved by the Signer',
    example: 'BRK.A',
  })
  @IsTicker()
  readonly ticker: string;

  @ApiPropertyOptional({
    description: 'The total supply count of the Asset',
    example: '627880',
  })
  @IsOptional()
  @ToBigNumber()
  @IsBigNumber()
  readonly totalSupply?: BigNumber;

  @ApiProperty({
    description: 'Specifies if an Asset can be divided',
    example: 'false',
  })
  @IsBoolean()
  readonly isDivisible: boolean;

  @ApiProperty({
    description: 'The type of Asset',
    enum: KnownTokenType,
    example: KnownTokenType.EquityCommon,
  })
  @IsEnum(KnownTokenType)
  readonly tokenType: KnownTokenType;

  @ApiPropertyOptional({
    description: 'List of Asset Identifiers',
    example: `[{ "type": "${TokenIdentifierType.Isin}", "value": "US0846701086"}]`,
    isArray: true,
  })
  @ValidateNested()
  @Type(() => AssetIdentifierDto)
  readonly tokenIdentifiers?: TokenIdentifier[];

  @ApiPropertyOptional({
    description: 'The current funding round of the Asset',
    example: 'Series A',
  })
  @IsOptional()
  @IsString()
  readonly fundingRound?: string;

  @ApiPropertyOptional({
    description: 'Documents related to the Asset',
    isArray: true,
    example: [
      {
        name: 'Annual report, 2021',
        uri: 'https://www.sec.gov/ix?doc=/Archives/edgar/data/1067983/000156459021009611/brka-10k_20201231.htm',
        contentHash: 'h512',
        type: '10K',
      },
    ],
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AssetDocumentDto)
  readonly documents?: TokenDocument[];
}
