/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { KnownAssetType } from '@polymathnetwork/polymesh-sdk/types';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';

import { AssetDocumentDto } from '~/assets/dto/asset-document.dto';
import { SecurityIdentifierDto } from '~/assets/dto/security-identifier.dto';
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
    description: 'The initial supply count of the Asset',
    example: '627880',
    type: BigNumber,
  })
  @IsOptional()
  @ToBigNumber()
  @IsBigNumber()
  readonly initialSupply?: BigNumber;

  @ApiProperty({
    description: 'Specifies if the Asset can be divided',
    example: 'false',
  })
  @IsBoolean()
  readonly isDivisible: boolean;

  @ApiProperty({
    description: 'The type of Asset',
    enum: KnownAssetType,
    example: KnownAssetType.EquityCommon,
  })
  @IsString()
  readonly assetType: string;

  @ApiProperty({
    description:
      'Specifies whether Identities must have an Investor Uniqueness Claim in order to be able to hold this Asset. More info [here](https://developers.polymesh.live/introduction/identity#polymesh-unique-identity-system-puis)',
    example: true,
  })
  @IsBoolean()
  readonly requireInvestorUniqueness: boolean;

  @ApiPropertyOptional({
    description: "List of Asset's Security Identifiers",
    isArray: true,
    type: SecurityIdentifierDto,
  })
  @ValidateNested({ each: true })
  @Type(() => SecurityIdentifierDto)
  readonly identifiers?: SecurityIdentifierDto[];

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
    type: AssetDocumentDto,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AssetDocumentDto)
  readonly documents?: AssetDocumentDto[];
}
