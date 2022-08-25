/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Identity, TickerReservationStatus } from '@polymeshassociation/polymesh-sdk/types';

import { FromEntity } from '~/common/decorators/transformation';

export class TickerReservationModel {
  @ApiProperty({
    description:
      "The DID of the Reservation owner. A null value means the ticker isn't currently reserved",
    type: 'string',
    example: '0x0600000000000000000000000000000000000000000000000000000000000000',
    nullable: true,
  })
  @FromEntity()
  readonly owner: Identity | null;

  @ApiProperty({
    description:
      'Date at which the Reservation expires. A null value means it never expires (permanent Reservation or Asset already launched)',
    type: 'string',
    example: new Date('05/23/2021').toISOString(),
    nullable: true,
  })
  readonly expiryDate: Date | null;

  @ApiProperty({
    description: 'Status of the ticker Reservation',
    type: 'string',
    enum: TickerReservationStatus,
    example: TickerReservationStatus.Free,
  })
  readonly status: TickerReservationStatus;

  constructor(model: TickerReservationModel) {
    Object.assign(this, model);
  }
}
