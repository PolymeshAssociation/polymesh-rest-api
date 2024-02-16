/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Type } from 'class-transformer';

import { FromBigNumber } from '~/common/decorators/transformation';
import { ConfidentialAccountModel } from '~/confidential-accounts/models/confidential-account.model';
import { ConfidentialAssetAuditorModel } from '~/confidential-transactions/models/confidential-asset-auditor.model';
import { IdentityModel } from '~/identities/models/identity.model';

export class ConfidentialLegModel {
  @ApiProperty({
    description: 'The index of this leg in the Confidential Transaction',
    type: 'string',
    example: '1',
  })
  @FromBigNumber()
  readonly id: BigNumber;

  @ApiProperty({
    description: 'Confidential Account from which the transfer is to be made',
    type: ConfidentialAccountModel,
  })
  @Type(() => ConfidentialAccountModel)
  readonly sender: ConfidentialAccountModel;

  @ApiProperty({
    description: 'Confidential Account to which the transfer is to be made',
    type: ConfidentialAccountModel,
  })
  @Type(() => ConfidentialAccountModel)
  readonly receiver: ConfidentialAccountModel;

  @ApiPropertyOptional({
    description: 'List of mediators configured for this leg',
    type: IdentityModel,
    isArray: true,
  })
  @Type(() => IdentityModel)
  readonly mediators?: IdentityModel[];

  @ApiPropertyOptional({
    description: 'Auditors for the leg, grouped by asset they are auditors for',
    type: ConfidentialAssetAuditorModel,
    isArray: true,
  })
  @Type(() => ConfidentialAssetAuditorModel)
  readonly assetAuditors?: ConfidentialAssetAuditorModel[];

  constructor(model: ConfidentialLegModel) {
    Object.assign(this, model);
  }
}
