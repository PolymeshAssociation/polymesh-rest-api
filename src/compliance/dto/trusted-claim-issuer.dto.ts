import { ApiPropertyOptional } from '@nestjs/swagger';
import { ClaimType } from '@polymeshassociation/polymesh-sdk/types';
import { IsEnum, IsOptional } from 'class-validator';

import { IsDid } from '~/common/decorators/validation';

export class TrustedClaimIssuerDto {
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
    description: 'The Identity of the Claim Issuer',
    type: 'string',
  })
  @IsOptional()
  @IsDid()
  readonly identity: string;
}
