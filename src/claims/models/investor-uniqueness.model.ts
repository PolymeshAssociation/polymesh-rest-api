import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import {
  ClaimType,
  InvestorUniquenessClaim,
  ScopeType,
} from '@polymeshassociation/polymesh-sdk/types';

import { ClaimModel } from '~/claims/models/claim.model';

export class InvestorUniquenessModel extends PartialType(OmitType(ClaimModel, ['claim'] as const)) {
  @ApiProperty({
    description: 'Details of the Claim containing type and scope',
    example: {
      type: ClaimType.InvestorUniqueness,
      scope: {
        type: ScopeType.Identity,
        value: '0x0600000000000000000000000000000000000000000000000000000000000000',
      },
      cddId: '0x0600000000000000000000000000000000000000000000000000000000000000',
      scopeId: '0x0600000000000000000000000000000000000000000000000000000000000000',
    },
  })
  readonly claim: InvestorUniquenessClaim;
}
