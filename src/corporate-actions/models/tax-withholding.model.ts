/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Identity } from '@polymeshassociation/polymesh-sdk/types';

import { FromBigNumber, FromEntity } from '~/common/decorators/transformation';

export class TaxWithholdingModel {
  @ApiProperty({
    description: 'DID for which the tax withholding percentage is overridden',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @FromEntity()
  readonly identity: Identity;

  @ApiProperty({
    description: 'Tax withholding percentage (from 0 to 100)',
    type: 'string',
    example: '67.25',
  })
  @FromBigNumber()
  readonly percentage: BigNumber;

  constructor(model: TaxWithholdingModel) {
    Object.assign(this, model);
  }
}
