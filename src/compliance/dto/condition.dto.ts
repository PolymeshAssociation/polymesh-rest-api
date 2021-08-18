/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ConditionTarget,
  ConditionType,
  isMultiClaimCondition,
  isSingleClaimCondition,
} from '@polymathnetwork/polymesh-sdk/types';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmptyObject, ValidateIf, ValidateNested } from 'class-validator';

import { ClaimDto } from '~/claims/dto/claim.dto';
import { IsDid } from '~/common/decorators/validation';
import { IssuerDto } from '~/compliance/dto/issuer.dto';

export class ConditionDto {
  @ApiProperty({
    description: 'The target of the Condition. Note different types need different payloads',
    enum: ConditionTarget,
  })
  @IsEnum(ConditionTarget)
  target: ConditionTarget;

  @ApiProperty({
    description: 'The type of Condition',
    enum: ConditionType,
    example: ConditionType.IsNoneOf,
  })
  @IsEnum(ConditionType)
  type: ConditionType;

  @ApiPropertyOptional({
    description: 'Optional Trusted Claim Providers for this condition. Defaults to all',
    isArray: true,
    type: IssuerDto,
    example: [],
  })
  @ValidateNested({ each: true })
  @Type(() => IssuerDto)
  trustedClaimProviders?: IssuerDto[];

  @ApiPropertyOptional({
    description: 'The Claim for IsPresent or IsAbsent Conditions',
    type: ClaimDto,
    example: null,
  })
  @ValidateIf(isSingleClaimCondition)
  @Type(() => ClaimDto)
  @IsNotEmptyObject()
  claim?: ClaimDto;

  @ApiPropertyOptional({
    description: 'Claims for AnyOf or NoneOf Conditions',
    isArray: true,
    type: ClaimDto,
  })
  @ValidateIf(isMultiClaimCondition)
  @ValidateNested({ each: true })
  @Type(() => ClaimDto)
  claims?: ClaimDto[];

  @ApiPropertyOptional({
    description: 'The identity for Identity Condition',
    example: null,
  })
  @ValidateIf(({ type }) => [ConditionType.IsIdentity].includes(type))
  @IsDid()
  identity?: string;
}
