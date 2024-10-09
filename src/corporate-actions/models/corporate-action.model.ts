/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Type } from 'class-transformer';

import { FromBigNumber } from '~/common/decorators/transformation';
import { CorporateActionTargetsModel } from '~/corporate-actions/models/corporate-action-targets.model';
import { TaxWithholdingModel } from '~/corporate-actions/models/tax-withholding.model';

export class CorporateActionModel {
  @ApiProperty({
    description: 'ID of the Corporate Action',
    type: 'string',
    example: '1',
  })
  @FromBigNumber()
  readonly id: BigNumber;

  @ApiProperty({
    description:
      'The Asset associated with the corporate action. NOTE: For 6.x chains, asset is represented by its ticker, but from 7.x, asset is represented by its unique Asset ID',
    type: 'string',
    examples: ['TICKER', '0xa3616b82e8e1080aedc952ea28b9db8b'],
  })
  readonly asset: string;

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
    description: 'Identities that will be affected by this Corporate Action',
    type: CorporateActionTargetsModel,
  })
  @Type(() => CorporateActionTargetsModel)
  readonly targets: CorporateActionTargetsModel;

  @ApiProperty({
    description:
      "Tax withholding percentage(0-100) that applies to Identities that don't have a specific percentage assigned to them",
    type: 'string',
    example: '25',
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
