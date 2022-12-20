import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';

import { ClaimModel } from '~/claims/models/claim.model';
import { InvestorUniquenessClaimModel } from '~/claims/models/investor-uniqueness-claim.model';
import { FromEntity } from '~/common/decorators/transformation';

export class InvestorUniquenessModel extends PartialType(OmitType(ClaimModel, ['claim'] as const)) {
  @ApiProperty({
    description: 'Details of the Claim containing type and scope',
    type: InvestorUniquenessClaimModel,
  })
  @FromEntity()
  readonly claim: InvestorUniquenessClaimModel;
}
