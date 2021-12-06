/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { RequirementModel } from '~/assets/models/requirement.model';
import { TrustedClaimIssuerModel } from '~/assets/models/trusted-claim-issuer.model';

export class ComplianceRequirementsModel {
  @ApiProperty({
    description: 'List of Assets compliance requirements',
    type: RequirementModel,
    isArray: true,
  })
  @Type(() => RequirementModel)
  readonly requirements: RequirementModel[];

  @ApiProperty({
    description:
      'List of default trusted Claim issuers. This is used for conditions where no trusted Claim issuers were specified',
    type: TrustedClaimIssuerModel,
    isArray: true,
  })
  @Type(() => TrustedClaimIssuerModel)
  readonly defaultTrustedClaimIssuers: TrustedClaimIssuerModel[];

  constructor(model: ComplianceRequirementsModel) {
    Object.assign(this, model);
  }
}
