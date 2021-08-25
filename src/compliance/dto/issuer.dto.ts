import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClaimType } from '@polymathnetwork/polymesh-sdk/types';
import { IsEnum, IsOptional } from 'class-validator';

import { IsDid } from '~/common/decorators/validation';

export class IssuerDto {
  @ApiProperty({
    description: 'The identity of the Issuer',
  })
  @IsDid()
  identity: string;

  @ApiPropertyOptional({
    description: 'List of Claim types for which an issuer is trusted. Defaults to all types',
    enum: ClaimType,
    isArray: true,
  })
  @IsOptional()
  @IsEnum(ClaimType)
  trustedFor?: ClaimType[];
}
