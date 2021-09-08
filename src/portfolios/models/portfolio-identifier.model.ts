/* istanbul ignore file */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
  readonly id?: string;

  constructor(model: PortfolioIdentifierModel) {
    Object.assign(this, model);
  }
}
