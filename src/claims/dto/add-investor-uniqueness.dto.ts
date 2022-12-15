/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { ScopeClaimProof } from '@polymeshassociation/polymesh-sdk/types';
import { Type } from 'class-transformer';
import { IsNotEmpty, ValidateNested } from 'class-validator';

import { ScopeDto } from '~/claims/dto/scope.dto';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class AddInvestorUniquenessDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'The type of Claim. Note that different types require different fields',
  })
  scope: ScopeDto;

  cddId: string;

  proof: string | ScopeClaimProof;

  scopeId: string;

  expiry?: Date;
}
