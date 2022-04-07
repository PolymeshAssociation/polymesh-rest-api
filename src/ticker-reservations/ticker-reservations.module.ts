/* istanbul ignore file */

import { Module } from '@nestjs/common';

import { PolymeshModule } from '~/polymesh/polymesh.module';
import { SigningModule } from '~/signing/signing.module';
import { TickerReservationsController } from '~/ticker-reservations/ticker-reservations.controller';
import { TickerReservationsService } from '~/ticker-reservations/ticker-reservations.service';

@Module({
  imports: [PolymeshModule, SigningModule],
  controllers: [TickerReservationsController],
  providers: [TickerReservationsService],
  exports: [TickerReservationsService],
})
export class TickerReservationsModule {}
