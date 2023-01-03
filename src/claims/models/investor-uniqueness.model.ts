import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { ClaimModel } from '~/claims/models/claim.model';
import { InvestorUniquenessClaimModel } from '~/claims/models/investor-uniqueness-claim.model';

export class InvestorUniquenessModel extends OmitType(ClaimModel, ['claim'] as const) {
  @ApiProperty({
    description: 'Details of the Claim containing type and scope',
    type: InvestorUniquenessClaimModel,
  })
  @Type(() => InvestorUniquenessClaimModel)
  readonly claim: InvestorUniquenessClaimModel;
}
