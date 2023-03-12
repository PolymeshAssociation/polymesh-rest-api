/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { ExtrinsicDataWithFees } from '@polymeshassociation/polymesh-sdk/types';
import { Type } from 'class-transformer';

import { ExtrinsicModel } from '~/common/models/extrinsic.model';
import { FeesModel } from '~/common/models/fees.model';

export class ExtrinsicDetailsModel extends ExtrinsicModel {
  @ApiProperty({
    description: 'Fee details for the transaction',
    type: FeesModel,
  })
  @Type(() => FeesModel)
  readonly fee: FeesModel;

  constructor(model: ExtrinsicDataWithFees) {
    const { fee, ...extrinsic } = model;
    super(extrinsic);

    this.fee = new FeesModel(fee);
  }
}
