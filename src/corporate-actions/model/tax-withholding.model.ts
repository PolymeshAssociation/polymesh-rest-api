/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { Identity } from '@polymathnetwork/polymesh-sdk/internal';

import { FromBigNumber, FromEntity } from '~/common/decorators/transformation';

export class TaxWithholdingModel {
  @ApiProperty({
    description: 'DID for which withholding tax is overridden',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @FromEntity()
  identity: Identity;

  @ApiProperty({
    description: 'Tax withholding percentage',
    type: 'string',
    example: '0.0001',
  })
  @FromBigNumber()
  percentage: BigNumber;

  constructor(model: TaxWithholdingModel) {
    Object.assign(this, model);
  }
}
