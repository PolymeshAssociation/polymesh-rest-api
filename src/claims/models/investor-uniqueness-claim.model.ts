/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { ClaimType } from '@polymeshassociation/polymesh-sdk/types';
import { Type } from 'class-transformer';

import { ScopeModel } from '~/claims/models/scope.model';

export class InvestorUniquenessClaimModel {
  @ApiProperty({
    type: 'string',
    description: 'Claim type',
    example: 'InvestorUniqueness',
  })
  readonly type: ClaimType.InvestorUniqueness;

  @ApiProperty({
    type: ScopeModel,
    description: 'Scope of the Claim',
  })
  @Type(() => ScopeModel)
  readonly scope: ScopeModel;

  @ApiProperty({
    type: 'string',
    description: 'CDD ID of the Claim',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  readonly cddId: string;

  @ApiProperty({
    type: 'string',
    description: 'Scope ID of the Claim',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  readonly scopeId: string;

  constructor(model: InvestorUniquenessClaimModel) {
    Object.assign(this, model);
  }
}
