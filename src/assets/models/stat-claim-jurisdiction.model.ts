/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { ClaimType, CountryCode } from '@polymeshassociation/polymesh-sdk/types';

import { StatClaimModel } from '~/assets/models/stat-claim.model';

export class StatJurisdictionClaimModel extends StatClaimModel {
  declare readonly type: ClaimType.Jurisdiction;

  @ApiProperty({
    description: 'Country code for the jurisdiction claim',
    enum: CountryCode,
    nullable: true,
    example: CountryCode.Ca,
  })
  readonly countryCode: CountryCode | null;

  constructor(model: StatJurisdictionClaimModel) {
    super(model);

    Object.assign(this, model);
  }
}
