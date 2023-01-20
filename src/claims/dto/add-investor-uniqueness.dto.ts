/* istanbul ignore file */

import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, ValidateIf } from 'class-validator';

import { ScopeClaimProofDto } from '~/claims/dto/scope-claim-proof.dto';
import { ScopeDto } from '~/claims/dto/scope.dto';
import { ApiPropertyOneOf } from '~/common/decorators/swagger';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

@ApiExtraModels(ScopeClaimProofDto)
export class AddInvestorUniquenessDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'The type of Claim. Note that different types require different fields',
  })
  @Type(() => ScopeDto)
  readonly scope: ScopeDto;

  @ApiProperty({
    description: 'The CDD ID of the investor',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @IsString()
  readonly cddId: string;

  @ApiPropertyOneOf({
    description: 'The proof of the claim',
    union: [
      {
        type: 'string',
        example: '0x0600000000000000000000000000000000000000000000000000000000000000',
      },
      ScopeClaimProofDto,
    ],
  })
  @ValidateIf(({ proof }) => typeof proof !== 'string')
  @Type(() => ScopeClaimProofDto)
  readonly proof: string | ScopeClaimProofDto;

  @ApiProperty({
    description: 'The scope ID of the claim',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @IsString()
  readonly scopeId: string;

  @ApiProperty({
    description: 'The expiry date of the claim',
    example: '2020-01-01',
  })
  @IsOptional()
  @IsDate()
  readonly expiry?: Date;
}
