/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { TransferRestrictionType } from '@polymeshassociation/polymesh-sdk/types';

import { TransferRestrictionModel } from '~/assets/models/transfer-restriction.model';
import { FromBigNumber } from '~/common/decorators/transformation';

export class TransferRestrictionPercentageModel extends TransferRestrictionModel {
  declare readonly type: TransferRestrictionType.Count;

  @ApiProperty({
    description: 'The percentage value for the transfer restriction',
    type: 'string',
    example: '50',
  })
  @FromBigNumber()
  readonly value: BigNumber;

  constructor(model: TransferRestrictionPercentageModel) {
    super(model);

    Object.assign(this, model);
  }
}
