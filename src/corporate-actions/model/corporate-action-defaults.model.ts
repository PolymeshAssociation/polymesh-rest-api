/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { Type } from 'class-transformer';

import { FromBigNumber } from '~/common/decorators/transformation';
import { CorporateActionTargetsModel } from '~/corporate-actions/model/corporate-action-targets.model';
import { TaxWithholdingModel } from '~/corporate-actions/model/tax-withholding.model';

export class CorporateActionDefaultsModel {
  @ApiProperty({
    description: 'The target DIDs relevant to this Corporate Action',
    type: CorporateActionTargetsModel,
  })
  targets: CorporateActionTargetsModel;

  @ApiProperty({
    description: 'The default withholding tax at the time of Corporate Action creation',
    type: 'string',
    example: '0.0005',
  })
  @FromBigNumber()
  defaultTaxWithholding: BigNumber;

  @ApiProperty({
    description: 'List of withholding tax overrides in relation to the default.',
    type: TaxWithholdingModel,
    isArray: true,
  })
  @Type(() => TaxWithholdingModel)
  taxWithholdings: TaxWithholdingModel[];

  constructor(model: CorporateActionDefaultsModel) {
    Object.assign(this, model);
  }
}
