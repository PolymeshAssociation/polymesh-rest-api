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
import { IsDid } from '~/common/decorators/validation';
import { TrustedClaimIssuerDto } from '~/compliance/dto/trusted-claim-issuer.dto';

export class ConditionDto {
  @ApiProperty({
    description: 'Whether the Condition applies to the sender, the receiver, or both',
    enum: ConditionTarget,
    example: ConditionTarget.Both,
  })
  @IsEnum(ConditionTarget)
  readonly target: ConditionTarget;

  @ApiProperty({
    description:
      'The type of Condition. "IsPresent" requires the target(s) to have a specific Claim. "IsAbsent" is the opposite. "IsAnyOf" requires the target(s) to have at least one of a list of Claims. "IsNoneOf" is the opposite. "IsIdentity" requires the target(s) to be a specific Identity',
    enum: ConditionType,
    example: ConditionType.IsNoneOf,
  })
  @IsEnum(ConditionType)
  readonly type: ConditionType;

  @ApiPropertyOptional({
    description: 'Optional Trusted Claim Issuer for this Condition. Defaults to all',
    isArray: true,
    type: TrustedClaimIssuerDto,
  })
  @ValidateNested({ each: true })
  @Type(() => TrustedClaimIssuerDto)
  readonly trustedClaimIssuers?: TrustedClaimIssuerDto[];

  @ApiPropertyOptional({
    description: 'The Claim for "IsPresent" or "IsAbsent" Conditions',
    type: ClaimDto,
  })
  @ValidateIf(isSingleClaimCondition)
  @ValidateNested()
  @Type(() => ClaimDto)
  @IsNotEmptyObject()
  readonly claim?: ClaimDto;

  @ApiPropertyOptional({
    description: 'Claims for "IsAnyOf" or "IsNoneOf" Conditions',
    isArray: true,
    type: ClaimDto,
  })
  @ValidateIf(isMultiClaimCondition)
  @ValidateNested({ each: true })
  @IsNotEmpty()
  @Type(() => ClaimDto)
  readonly claims?: ClaimDto[];

  @ApiPropertyOptional({
    description: 'The DID of the Identity for "IsIdentity" Conditions',
    type: 'string',
  })
  @ValidateIf(({ type }) => type === ConditionType.IsIdentity)
  @IsDid()
  readonly identity?: string;
}
