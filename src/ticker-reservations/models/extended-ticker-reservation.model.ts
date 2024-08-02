/* istanbul ignore file */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { TransactionQueueModel } from '~/common/models/transaction-queue.model';
import { TickerReservationModel } from '~/ticker-reservations/models/ticker-reservation.model';

export class ExtendedTickerReservationModel extends TransactionQueueModel {
  @ApiPropertyOptional({
    description: 'Details of the Ticker Reservation',
    type: TickerReservationModel,
  })
  @Type(() => TickerReservationModel)
  readonly tickerReservation: TickerReservationModel;

  constructor(model: ExtendedTickerReservationModel) {
    const { transactions, details, ...rest } = model;
    super({ transactions, details });

    Object.assign(this, rest);
  }
}
