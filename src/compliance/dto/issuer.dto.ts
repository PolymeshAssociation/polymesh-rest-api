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
    description: 'What Claim types this issuer is trusted for. Defaults to all types',
    enum: ClaimType,
    isArray: true,
  })
  @IsOptional()
  @IsEnum(ClaimType)
  trustedFor?: ClaimType[];
}
