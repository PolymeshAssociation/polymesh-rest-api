/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClaimType, CountryCode } from '@polymeshassociation/polymesh-sdk/types';
import { isCddClaim } from '@polymeshassociation/polymesh-sdk/utils';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmptyObject, IsOptional, ValidateIf, ValidateNested } from 'class-validator';

import { IsCddId } from '~/claims/decorators/validation';
import { ScopeDto } from '~/claims/dto/scope.dto';
import { TrustedClaimIssuerDto } from '~/compliance/dto/trusted-claim-issuer.dto';

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
      'The scope of the Claim. Required for most types except for `CustomerDueDiligence`, `InvestorUniquenessV2` and `NoData`',
    type: ScopeDto,
  })
  @ValidateIf(claim => !isCddClaim(claim))
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
    example: '0x60000000000000000000000000000000',
  })
  @ValidateIf(({ type }) => [ClaimType.CustomerDueDiligence].includes(type))
  @IsCddId()
  cddId?: string;

  @ApiPropertyOptional({
    description: 'Optional Identities to trust for this Claim. Defaults to all',
    isArray: true,
    type: TrustedClaimIssuerDto,
  })
  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => TrustedClaimIssuerDto)
  trustedClaimIssuers?: TrustedClaimIssuerDto[];
}
