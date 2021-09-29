import { ApiPropertyOptional } from '@nestjs/swagger';
import { ClaimType } from '@polymathnetwork/polymesh-sdk/types';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, ValidateNested } from 'class-validator';

import { IdentityDto } from '~/identities/dto/identity.dto';

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
    description: 'The Identity of the Claim Issuerer',
  })
  @ValidateNested()
  @Type(() => IdentityDto)
  readonly identity: IdentityDto;
}
