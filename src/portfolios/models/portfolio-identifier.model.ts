/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';

import { FromPortfolioId } from '~/common/decorators/transformation';

export class PortfolioIdentifierModel {
  @ApiProperty({
    description: 'The DID of the Portfolio owner',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  readonly did: string;

  @ApiProperty({
    description: 'Portfolio number. 0 represents the Default Portfolio',
    type: 'string',
    example: '123',
  })
  @FromPortfolioId()
  readonly id?: string;

  constructor(model: PortfolioIdentifierModel) {
    Object.assign(this, model);
  }
}
