/* istanbul ignore file */

import { Module } from '@nestjs/common';

import { PolymeshModule } from '~/polymesh/polymesh.module';
import { RelayerAccountsModule } from '~/relayer-accounts/relayer-accounts.module';
import { TickerReservationsController } from '~/ticker-reservations/ticker-reservations.controller';
import { TickerReservationsService } from '~/ticker-reservations/ticker-reservations.service';

@Module({
  imports: [PolymeshModule, RelayerAccountsModule],
  controllers: [TickerReservationsController],
  providers: [TickerReservationsService],
})
export class TickerReservationsModule {}
