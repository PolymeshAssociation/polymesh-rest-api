/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { TransferRestrictionType } from '@polymeshassociation/polymesh-sdk/types';
import { Type } from 'class-transformer';

import { TransferRestrictionModel } from '~/assets/models/transfer-restriction.model';
import { TransferRestrictionClaimValueModel } from '~/assets/models/transfer-restriction-claim-value.model';

export class TransferRestrictionClaimCountModel extends TransferRestrictionModel {
  declare readonly type: TransferRestrictionType.ClaimCount;

  @ApiProperty({
    description: 'The claim count restriction value',
    type: TransferRestrictionClaimValueModel,
  })
  @Type(() => TransferRestrictionClaimValueModel)
  readonly value: TransferRestrictionClaimValueModel;

  constructor(model: TransferRestrictionClaimCountModel) {
    super(model);

    Object.assign(this, model);
  }
}
