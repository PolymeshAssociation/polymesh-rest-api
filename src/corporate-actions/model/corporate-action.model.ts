/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { Type } from 'class-transformer';

import { FromBigNumber } from '~/common/decorators/transformation';
import { CorporateActionTargetsModel } from '~/corporate-actions/model/corporate-action-targets.model';
import { TaxWithholdingModel } from '~/corporate-actions/model/tax-withholding.model';

export class CorporateActionModel {
  @ApiProperty({
    description: 'ID of the Corporate Action',
    type: 'string',
    example: '1',
  })
  @FromBigNumber()
  readonly id: BigNumber;

  @ApiProperty({
    description: 'Ticker of the Asset',
    type: 'string',
    example: 'TICKER',
  })
  readonly ticker: string;

  @ApiProperty({
    description: 'Date at which the Corporate Action was created',
    type: 'string',
    example: new Date('10/14/1987').toISOString(),
  })
  readonly declarationDate: Date;

  @ApiProperty({
    description: 'Brief description of the Corporate Action',
    type: 'string',
    example: 'Corporate Action description',
  })
  readonly description: string;

  @ApiProperty({
    description:
      'Default value for Identities that will be affected by all future Corporate Actions',
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

  constructor(model: CorporateActionModel) {
    Object.assign(this, model);
  }
}
