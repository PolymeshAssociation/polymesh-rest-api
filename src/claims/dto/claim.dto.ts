/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ClaimType,
  CountryCode,
  isScopedClaim,
  ScopeType,
} from '@polymathnetwork/polymesh-sdk/types';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmptyObject, IsString, ValidateIf, ValidateNested } from 'class-validator';

import { ScopeDto } from '~/claims/dto/scope.dto';
import { IssuerDto } from '~/compliance/dto/issuer.dto';

export class ClaimDto {
  @ApiProperty({
    description: 'The type of Claim. Note that different types require different fields',
    enum: ClaimType,
    example: ClaimType.Accredited,
  })
  @IsEnum(ClaimType)
  type: ClaimType;

  @ApiPropertyOptional({
    description:
      'The scope of the Claim. Required for most types except for `CustomerDueDiliegence`, `InvestorUniqunessV2` and `NoData`',
    type: ScopeDto,
    example: {
      type: ScopeType.Identity,
      value: '0x0600000000000000000000000000000000000000000000000000000000000000',
    },
  })
  @ValidateIf(isScopedClaim)
  @ValidateNested()
  @Type(() => ScopeDto)
  @IsNotEmptyObject()
  scope?: ScopeDto;

  @ApiPropertyOptional({
    description: 'Country code for `Jurisdiction` type Claims',
    enum: CountryCode,
    example: CountryCode.Ca,
  })
  @ValidateIf(({ type }) => type === ClaimType.Jurisdiction)
  @IsEnum(CountryCode)
  code?: CountryCode;

  @ApiPropertyOptional({
    description: 'cddId for `CustomerDueDiligence` and `InvestorUniqueness` type Claims',
    example: 'ABC123',
  })
  @ValidateIf(({ type }) =>
    [
      ClaimType.InvestorUniqueness,
      ClaimType.InvestorUniquenessV2,
      ClaimType.CustomerDueDiligence,
    ].includes(type)
  )
  @IsString()
  cddId?: string;

  @ApiPropertyOptional({
    description: 'Optional Issuers to trust for this Claim. Defaults to all',
    isArray: true,
    enum: IssuerDto,
    example: [],
  })
  @ValidateNested({ each: true })
  @Type(() => IssuerDto)
  issuers?: IssuerDto[];
}
