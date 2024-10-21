/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { KnownAssetType } from '@polymeshassociation/polymesh-sdk/types';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';

import { AssetDocumentDto } from '~/assets/dto/asset-document.dto';
import { SecurityIdentifierDto } from '~/assets/dto/security-identifier.dto';
import { ToBigNumber } from '~/common/decorators/transformation';
import { IsBigNumber, IsTicker } from '~/common/decorators/validation';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class CreateAssetDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'The name of the Asset',
    example: 'Asset Corp',
  })
  @IsString()
  readonly name: string;

  @ApiPropertyOptional({
    description:
      'The ticker of the Asset. This must either be free or reserved by the Signer. Note, this value is optional from 7.x chain',
    example: 'TICKER',
  })
  @IsOptional()
  @IsTicker()
  readonly ticker?: string;

  @ApiPropertyOptional({
    description: 'The initial supply count of the Asset',
    example: '627880',
    type: 'string',
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

  @ApiPropertyOptional({
    description: "List of Asset's Security Identifiers",
    isArray: true,
    type: SecurityIdentifierDto,
  })
  @ValidateNested({ each: true })
  @Type(() => SecurityIdentifierDto)
  readonly securityIdentifiers?: SecurityIdentifierDto[];

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
