/* istanbul ignore file */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';

import { AccountsModule } from '~/accounts/accounts.module';
import { AssetsModule } from '~/assets/assets.module';
import { AuthorizationsModule } from '~/authorizations/authorizations.module';
import { CheckpointsModule } from '~/checkpoints/checkpoints.module';
import { ClaimsModule } from '~/claims/claims.module';
import { ComplianceModule } from '~/compliance/compliance.module';
import { CorporateActionsModule } from '~/corporate-actions/corporate-actions.module';
import { DeveloperTestingModule } from '~/developer-testing/developer-testing.module';
import { EventsModule } from '~/events/events.module';
import { IdentitiesModule } from '~/identities/identities.module';
import { NotificationsModule } from '~/notifications/notifications.module';
import { OfferingsModule } from '~/offerings/offerings.module';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PortfoliosModule } from '~/portfolios/portfolios.module';
import { ScheduleModule } from '~/schedule/schedule.module';
import { SettlementsModule } from '~/settlements/settlements.module';
import { SigningModule } from '~/signing/signing.module';
import { SubscriptionsModule } from '~/subscriptions/subscriptions.module';
import { TickerReservationsModule } from '~/ticker-reservations/ticker-reservations.module';
import { TransactionsModule } from '~/transactions/transactions.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000),
        POLYMESH_NODE_URL: Joi.string().required(),
        POLYMESH_MIDDLEWARE_URL: Joi.string(),
        POLYMESH_MIDDLEWARE_API_KEY: Joi.string(),
        SUBSCRIPTIONS_TTL: Joi.number().default(60000),
        SUBSCRIPTIONS_MAX_HANDSHAKE_TRIES: Joi.number().default(5),
        SUBSCRIPTIONS_HANDSHAKE_RETRY_INTERVAL: Joi.number().default(5000),
        NOTIFICATIONS_MAX_TRIES: Joi.number().default(5),
        NOTIFICATIONS_RETRY_INTERVAL: Joi.number().default(5000),
        SUBSCRIPTIONS_LEGITIMACY_SECRET: Joi.string().default('defaultSecret'),
        LOCAL_SIGNERS: Joi.string().allow(''),
        LOCAL_MNEMONICS: Joi.string().allow(''),
        VAULT_TOKEN: Joi.string().allow(''),
        VAULT_URL: Joi.string().allow(''),
        DEVELOPER_UTILS: Joi.bool().default(false),
      })
        .and('POLYMESH_MIDDLEWARE_URL', 'POLYMESH_MIDDLEWARE_API_KEY')
        .and('LOCAL_SIGNERS', 'LOCAL_MNEMONICS')
        .and('VAULT_TOKEN', 'VAULT_URL'),
    }),
    AssetsModule,
    TickerReservationsModule,
    PolymeshModule,
    IdentitiesModule,
    SettlementsModule,
    SigningModule,
    AuthorizationsModule,
    PortfoliosModule,
    ClaimsModule,
    OfferingsModule,
    CheckpointsModule,
    CorporateActionsModule,
    ComplianceModule,
    AccountsModule,
    SubscriptionsModule,
    TransactionsModule,
    EventsModule,
    NotificationsModule,
    ScheduleModule,
    DeveloperTestingModule,
  ],
})
export class AppModule {}
