/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Identity } from '@polymathnetwork/polymesh-sdk/internal';
import { VenueType } from '@polymathnetwork/polymesh-sdk/types';

import { FromEntity } from '~/common/decorators/transformation';

export class VenueDetailsModel {
  @ApiProperty({
    description: 'The DID of the Venue owner',
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @FromEntity()
  readonly owner: Identity;

  @ApiProperty({
    description: 'Description of the Venue',
    type: 'string',
    example: 'VENUE-DESC',
  })
  readonly description: string;

  @ApiProperty({
    description: 'Type of the Venue',
    type: 'string',
    enum: VenueType,
    example: VenueType.Distribution,
  })
  readonly type: VenueType;

  constructor(model: VenueDetailsModel) {
    Object.assign(this, model);
  }
}
