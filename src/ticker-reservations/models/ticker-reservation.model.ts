/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Identity, TickerReservationStatus } from '@polymathnetwork/polymesh-sdk/types';

import { FromEntity } from '~/common/decorators/transformation';

export class TickerReservationModel {
  @ApiProperty({
    description: "The DID of the Asset owner. A null value means the ticker hasn't been reserved",
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
  })
  @FromEntity()
  readonly owner: Identity | null;

  @ApiProperty({
    description:
      'Date at which the reservation expires. A null value means it never expires (permanent reservation or Asset already launched)',
    type: 'string',
    example: new Date('05/23/2021').toISOString(),
  })
  readonly expiryDate: Date | null;

  @ApiProperty({
    description: 'Status of the ticker reservation',
    type: 'string',
    enum: TickerReservationStatus,
    example: TickerReservationStatus.Free,
  })
  readonly status: TickerReservationStatus;

  constructor(model: TickerReservationModel) {
    Object.assign(this, model);
  }
}
