/* istanbul ignore file */

import { ApiExtraModels, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClaimType, CountryCode } from '@polymeshassociation/polymesh-sdk/types';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class StatClaimBaseDto {
  @ApiProperty({
    description: 'Type of input stat claim',
    enum: [ClaimType.Jurisdiction, ClaimType.Accredited, ClaimType.Affiliate],
    example: ClaimType.Accredited,
  })
  @IsEnum(ClaimType)
  readonly type: ClaimType;
}

export class StatAccreditedClaimDto extends StatClaimBaseDto {
  declare readonly type: ClaimType.Accredited;

  @ApiProperty({
    description: 'Whether the Identity is accredited',
    type: 'boolean',
    example: true,
  })
  @IsBoolean()
  readonly accredited: boolean;
}

export class StatAffiliateClaimDto extends StatClaimBaseDto {
  declare readonly type: ClaimType.Affiliate;

  @ApiProperty({
    description: 'Whether the Identity is an affiliate',
    type: 'boolean',
    example: true,
  })
  @IsBoolean()
  readonly affiliate: boolean;
}

export class StatJurisdictionClaimDto extends StatClaimBaseDto {
  declare readonly type: ClaimType.Jurisdiction;

  @ApiPropertyOptional({
    description: 'Country code for the jurisdiction claim',
    enum: CountryCode,
    example: CountryCode.Ca,
  })
  @IsOptional()
  @IsEnum(CountryCode)
  readonly countryCode?: CountryCode;
}

@ApiExtraModels(StatAccreditedClaimDto, StatAffiliateClaimDto, StatJurisdictionClaimDto)
export class StatClaimDto extends StatClaimBaseDto {}
