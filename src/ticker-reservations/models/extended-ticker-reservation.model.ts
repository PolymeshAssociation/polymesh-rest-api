/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { TickerReservationModel } from '~/ticker-reservations/models/ticker-reservation.model';

export class ExtendedTickerReservationModel extends TransactionQueueModel {
  @ApiProperty({
    description: 'Details of the Ticker Reservation',
    type: TickerReservationModel,
  })
  @Type(() => TickerReservationModel)
  readonly tickerReservation: TickerReservationModel;

  constructor(model: ExtendedTickerReservationModel) {
    const { transactions, ...rest } = model;
    super({ transactions });

    Object.assign(this, rest);
  }
}
