/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { Type } from 'class-transformer';

import { FromBigNumber } from '~/common/decorators/transformation';
import { CorporateActionTargetsModel } from '~/corporate-actions/model/corporate-action-targets.model';
import { TaxWithholdingModel } from '~/corporate-actions/model/tax-withholding.model';

export class CorporateActionDefaultsModel {
  @ApiProperty({
    description: 'Identities that will be affected by the Corporate Actions',
    type: CorporateActionTargetsModel,
  })
  @Type(() => CorporateActionTargetsModel)
  readonly targets: CorporateActionTargetsModel;

  @ApiProperty({
    description:
      "Tax withholding percentage that applies to Identities that don't have a specific percentage assigned to them",
    type: 'string',
    example: '0.0005',
  })
  @FromBigNumber()
  readonly defaultTaxWithholding: BigNumber;

  @ApiProperty({
    description:
      'List of Identities and the specific tax withholding percentage that should apply to them. This takes precedence over `defaultTaxWithholding`',
    type: TaxWithholdingModel,
    isArray: true,
  })
  @Type(() => TaxWithholdingModel)
  readonly taxWithholdings: TaxWithholdingModel[];

  constructor(model: CorporateActionDefaultsModel) {
    Object.assign(this, model);
  }
}
