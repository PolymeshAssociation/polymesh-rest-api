/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { ScopeClaimProof } from '@polymeshassociation/polymesh-sdk/types';

import { ScopeDto } from '~/claims/dto/scope.dto';
import { TransactionBaseDto } from '~/common/dto/transaction-base-dto';

export class AddInvestorUniquenessDto extends TransactionBaseDto {
  @ApiProperty({
    description: 'The type of Claim. Note that different types require different fields',
  })
  readonly scope: ScopeDto;

  @ApiProperty({
    description: 'The CDD ID of the investor',
  })
  readonly cddId: string;

  @ApiProperty({
    description: 'The proof of the claim',
  })
  readonly proof: string | ScopeClaimProof;

  @ApiProperty({
    description: 'The scope ID of the claim',
  })
  readonly scopeId: string;

  @ApiProperty({
    description: 'The expiry date of the claim',
  })
  readonly expiry?: Date;
}
