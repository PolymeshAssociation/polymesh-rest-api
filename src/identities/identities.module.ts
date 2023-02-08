/* istanbul ignore file */

import { forwardRef, Module } from '@nestjs/common';

import { AccountsModule } from '~/accounts/accounts.module';
import { AssetsModule } from '~/assets/assets.module';
import { AuthorizationsModule } from '~/authorizations/authorizations.module';
import { ClaimsModule } from '~/claims/claims.module';
import { DeveloperTestingModule } from '~/developer-testing/developer-testing.module';
import { IdentitiesController } from '~/identities/identities.controller';
import { IdentitiesService } from '~/identities/identities.service';
import { LoggerModule } from '~/logger/logger.module';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PortfoliosModule } from '~/portfolios/portfolios.module';
import { SettlementsModule } from '~/settlements/settlements.module';
import { TickerReservationsModule } from '~/ticker-reservations/ticker-reservations.module';
import { TransactionsModule } from '~/transactions/transactions.module';

@Module({
  imports: [
    PolymeshModule,
    LoggerModule,
    TransactionsModule,
    forwardRef(() => AssetsModule),
    forwardRef(() => SettlementsModule),
    forwardRef(() => AuthorizationsModule),
    forwardRef(() => PortfoliosModule),
    DeveloperTestingModule.register(),
    AccountsModule,
    ClaimsModule,
    TickerReservationsModule,
  ],
  controllers: [IdentitiesController],
  providers: [IdentitiesService],
  exports: [IdentitiesService],
})
export class IdentitiesModule {}
