/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { ClaimType } from '@polymeshassociation/polymesh-sdk/types';

import { ScopeModel } from '~/claims/models/scope.model';
import { FromEntity } from '~/common/decorators/transformation';

export class InvestorUniquenessClaimModel {
  @ApiProperty({
    type: 'string',
    description: 'Claim type',
    example: 'InvestorUniqueness',
  })
  @FromEntity()
  readonly type: ClaimType.InvestorUniqueness;

  @ApiProperty({
    type: ScopeModel,
    description: 'Scope of the Claim',
  })
  @FromEntity()
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
