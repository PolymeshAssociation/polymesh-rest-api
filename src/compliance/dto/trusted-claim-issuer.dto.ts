import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClaimType, Identity } from '@polymathnetwork/polymesh-sdk/types';
import { IsEnum, IsOptional } from 'class-validator';

import { IsDid } from '~/common/decorators/validation';

export class TrustedClaimIssuerDto {
  @ApiProperty({
    description: 'The DID of the Issuer',
  })
  @IsDid()
  readonly did: string;

  @ApiPropertyOptional({
    description:
      'List of Claim types for which an Identity is trusted for verifying. Defaults to all types',
    enum: ClaimType,
    isArray: true,
  })
  @IsOptional()
  @IsEnum(ClaimType, { each: true })
  readonly trustedFor?: ClaimType[];

  @ApiPropertyOptional({
    description: 'Placeholder to write to',
  })
  identity: Identity; // should be set based on did value
}
