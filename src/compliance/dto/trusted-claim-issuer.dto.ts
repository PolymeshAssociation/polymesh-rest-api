import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClaimType } from '@polymathnetwork/polymesh-sdk/types';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, ValidateNested } from 'class-validator';

import { IdentityDto } from '~/identities/dto/identity.dto';

export class TrustedClaimIssuerDto {
  @ApiProperty({
    description: 'The identity of the Issuer',
  })
  @Type(() => IdentityDto)
  @ValidateNested()
  identity: IdentityDto;

  @ApiPropertyOptional({
    description:
      'List of Claim types for which an Identity is trusted for verifying. Defaults to all types',
    enum: ClaimType,
    isArray: true,
  })
  @IsOptional()
  @IsEnum(ClaimType, { each: true })
  trustedFor?: ClaimType[];
}
