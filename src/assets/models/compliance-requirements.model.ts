/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { RequirementModel } from '~/assets/models/requirement.model';
import { TrustedClaimIssuerModel } from '~/assets/models/trusted-claim-issuer.model';

export class ComplianceRequirementsModel {
  @ApiProperty({
    description: "List of an Asset's compliance requirements",
    type: RequirementModel,
    isArray: true,
  })
  @Type(() => RequirementModel)
  readonly requirements: RequirementModel[];

  @ApiProperty({
    description:
      'List of default Trusted Claim Issuers. This is used for conditions where no trusted Claim issuers were specified (i.e. where `trustedClaimIssuers` is undefined)',
    type: TrustedClaimIssuerModel,
    isArray: true,
  })
  @Type(() => TrustedClaimIssuerModel)
  readonly defaultTrustedClaimIssuers: TrustedClaimIssuerModel[];

  constructor(model: ComplianceRequirementsModel) {
    Object.assign(this, model);
  }
}
