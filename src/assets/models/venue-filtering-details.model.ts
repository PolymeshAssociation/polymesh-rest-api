import { ApiProperty } from '@nestjs/swagger';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { FromBigNumber } from '~/common/decorators/transformation';

export class VenueFilteringDetailsModel {
  @ApiProperty({
    description: 'Whether venue filtering is enabled for the asset',
    type: 'boolean',
    example: true,
  })
  readonly isEnabled: boolean;

  @ApiProperty({
    description: 'Venues currently permitted to settle instructions for the asset',
    type: 'string',
    isArray: true,
    example: ['1', '2'],
  })
  @FromBigNumber()
  readonly allowedVenues: BigNumber[];

  @ApiProperty({
    description: 'Venues that have been explicitly disallowed from settling instructions',
    type: 'string',
    isArray: true,
    example: ['3'],
  })
  @FromBigNumber()
  readonly disallowedVenues: BigNumber[];

  constructor(model: VenueFilteringDetailsModel) {
    Object.assign(this, model);
  }
}
