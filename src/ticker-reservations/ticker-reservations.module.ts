/* istanbul ignore file */

import { Module } from '@nestjs/common';

import { PolymeshModule } from '~/polymesh/polymesh.module';
import { TickerReservationsController } from '~/ticker-reservations/ticker-reservations.controller';
import { TickerReservationsService } from '~/ticker-reservations/ticker-reservations.service';
import { TransactionsModule } from '~/transactions/transactions.module';

@Module({
  imports: [PolymeshModule, TransactionsModule],
  controllers: [TickerReservationsController],
  providers: [TickerReservationsService],
  exports: [TickerReservationsService],
})
export class TickerReservationsModule {}
