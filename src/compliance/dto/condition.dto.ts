/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ConditionTarget,
  ConditionType,
  isMultiClaimCondition,
  isSingleClaimCondition,
} from '@polymathnetwork/polymesh-sdk/types';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNotEmptyObject, ValidateIf, ValidateNested } from 'class-validator';

import { ClaimDto } from '~/claims/dto/claim.dto';
import { TrustedClaimIssuerDto } from '~/compliance/dto/trusted-claim-issuer.dto';

import { IdentityDto } from '../../identities/dto/identity.dto';

export class ConditionDto {
  @ApiProperty({
    description: 'Whether the Condition applies to the sender, the receiver, or both',
    enum: ConditionTarget,
    example: ConditionTarget.Both,
  })
  @IsEnum(ConditionTarget)
  target: ConditionTarget;

  @ApiProperty({
    description:
      'The type of Condition. "IsPresent" requires the target(s) to have a specific Claim. "IsAbsent" is the opposite. "IsAnyOf" requires the target(s) to have at least one of a list of Claims. "IsNoneOf" is the opposite. "IsIdentity" requires the target(s) to be a specific Identity',
    enum: ConditionType,
    example: ConditionType.IsNoneOf,
  })
  @IsEnum(ConditionType)
  type: ConditionType;

  @ApiPropertyOptional({
    description: 'Optional Trusted Claim Provider Identities for this Condition. Defaults to all',
    isArray: true,
    type: TrustedClaimIssuerDto,
  })
  @ValidateNested({ each: true })
  @Type(() => TrustedClaimIssuerDto)
  trustedClaimIssuers?: TrustedClaimIssuerDto[];

  @ApiPropertyOptional({
    description: 'The Claim for "IsPresent" or "IsAbsent" Conditions',
    type: ClaimDto,
  })
  @ValidateIf(isSingleClaimCondition)
  @ValidateNested()
  @Type(() => ClaimDto)
  @IsNotEmptyObject()
  claim?: ClaimDto;

  @ApiPropertyOptional({
    description: 'Claims for "IsAnyOf" or "IsNoneOf" Conditions',
    isArray: true,
    type: ClaimDto,
  })
  @ValidateIf(isMultiClaimCondition)
  @ValidateNested({ each: true })
  @IsNotEmpty()
  @Type(() => ClaimDto)
  claims?: ClaimDto[];

  @ApiPropertyOptional({
    description: 'The Identity for "IsIdentity" Condition',
  })
  @ValidateIf(({ type }) => type === ConditionType.IsIdentity)
  @Type(() => IdentityDto)
  @ValidateNested()
  identity?: IdentityDto;
}
