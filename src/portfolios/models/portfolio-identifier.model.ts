/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators/transformation';

export class PortfolioIdentifierModel {
  @ApiProperty({
    description: 'The DID of the Portfolio owner',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  readonly did: string;

  @ApiPropertyOptional({
    description: 'Portfolio number. An empty value represents the Default Portfolio',
    type: 'string',
    example: '123',
  })
  @FromBigNumber()
  readonly id?: BigNumber;

  constructor(model: PortfolioIdentifierModel) {
    Object.assign(this, model);
  }
}
