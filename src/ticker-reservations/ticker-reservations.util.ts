/* istanbul ignore file */

import { TickerReservation } from '@polymeshassociation/polymesh-sdk/types';

import { TickerReservationModel } from '~/ticker-reservations/models/ticker-reservation.model';

export async function createTickerReservationModel(
  tickerReservation: TickerReservation
): Promise<TickerReservationModel> {
  const { owner, expiryDate, status } = await tickerReservation.details();

  return new TickerReservationModel({ owner, expiryDate, status });
}
