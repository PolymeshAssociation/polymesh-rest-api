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
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';

import { TokenDocumentDto } from '~/assets/dto/token-document.dto';
import { TokenIdentifierDto } from '~/assets/dto/token-identifier.dto';
import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber } from '~/common/decorators/validation';
import { SignerDto } from '~/common/dto/signer.dto';

export class CreateAssetDto extends SignerDto {
  @ApiProperty({
    description: 'The name of the asset',
    example: 'Berkshire Hathaway Inc. Class A',
  })
  @IsString()
  readonly name: string;

  @ApiProperty({
    description: 'The ticker of the asset. This must already be reserved by the signer.',
    example: 'BRK.A',
  })
  @IsString()
  readonly ticker: string;

  @ApiPropertyOptional({
    description: 'The total amount of tokens',
    example: 627880,
  })
  @IsOptional()
  @ToBigNumber()
  @IsBigNumber()
  readonly totalSupply?: BigNumber;

  @ApiProperty({
    description:
      'Specifies if a token can be divided. If set to true only whole tokens can be transferred',
    example: 'false',
  })
  @IsBoolean()
  readonly isDivisible: boolean;

  @ApiProperty({
    description: 'The type of token. e.g. Equity, Debt, Commodity',
    enum: KnownTokenType,
    example: KnownTokenType.EquityCommon,
  })
  @IsEnum(KnownTokenType)
  readonly tokenType: KnownTokenType;

  @ApiPropertyOptional({
    description: 'The token identifiers',
    example: `[{ "type": "${TokenIdentifierType.Isin}", "value": "US0846701086"}]`,
  })
  @IsArray()
  @ValidateNested()
  @Type(() => TokenIdentifierDto)
  readonly tokenIdentifiers?: TokenIdentifier[];

  @ApiPropertyOptional({
    description: 'The current funding round of the security',
    example: 'Series A',
  })
  @IsOptional()
  @IsString()
  readonly fundingRound?: string;

  @ApiPropertyOptional({
    description: 'Documents related to the token',
    example: [
      {
        name: 'Annual report, 2021',
        uri: 'https://www.sec.gov/ix?doc=/Archives/edgar/data/1067983/000156459021009611/brka-10k_20201231.htm',
        contentHash: 'h512',
        type: '10K',
      },
    ],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested()
  @Type(() => TokenDocumentDto)
  readonly documents?: TokenDocument[];
}
