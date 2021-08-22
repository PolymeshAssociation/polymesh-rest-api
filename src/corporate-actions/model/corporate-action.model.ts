/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators/transformation';
import { CorporateActionDefaultsModel } from '~/corporate-actions/model/corporate-action-defaults.model';

export class CorporateActionModel extends CorporateActionDefaultsModel {
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

  constructor(model: CorporateActionModel) {
    const { targets, defaultTaxWithholding, taxWithholdings, ...rest } = model;
    super({ targets, defaultTaxWithholding, taxWithholdings });

    Object.assign(this, rest);
  }
}
