/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { AffirmationStatus } from '@polymeshassociation/polymesh-sdk/types';

import { FromBigNumber } from '~/common/decorators/transformation';

export class OffChainAffirmationModel {
  @ApiProperty({
    description: 'The index of the leg in the Instruction',
    type: 'string',
    example: '0',
  })
  @FromBigNumber()
  legId: BigNumber;

  @ApiProperty({
    description: 'The status of the off chain leg',
    type: 'string',
    enum: AffirmationStatus,
    example: AffirmationStatus.Affirmed,
  })
  status: AffirmationStatus;

  constructor(model: OffChainAffirmationModel) {
    Object.assign(this, model);
  }
}
