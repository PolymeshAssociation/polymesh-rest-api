/* istanbul ignore file */

import { forwardRef, Module } from '@nestjs/common';

import { AssetsModule } from '~/assets/assets.module';
import { AuthorizationsModule } from '~/authorizations/authorizations.module';
import { ClaimsModule } from '~/claims/claims.module';
import { IdentitiesController } from '~/identities/identities.controller';
import { IdentitiesService } from '~/identities/identities.service';
import { LoggerModule } from '~/logger/logger.module';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PortfoliosModule } from '~/portfolios/portfolios.module';
import { RelayerAccountsModule } from '~/relayer-accounts/relayer-accounts.module';
import { SettlementsModule } from '~/settlements/settlements.module';
import { TickerReservationsModule } from '~/ticker-reservations/ticker-reservations.module';

@Module({
  imports: [
    PolymeshModule,
    LoggerModule,
    RelayerAccountsModule,
    forwardRef(() => AssetsModule),
    forwardRef(() => SettlementsModule),
    forwardRef(() => AuthorizationsModule),
    forwardRef(() => PortfoliosModule),
    ClaimsModule,
    TickerReservationsModule,
  ],
  controllers: [IdentitiesController],
  providers: [IdentitiesService],
  exports: [IdentitiesService],
})
export class IdentitiesModule {}
