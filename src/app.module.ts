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
import { IdentitiesModule } from '~/identities/identities.module';
import { OfferingsModule } from '~/offerings/offerings.module';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PortfoliosModule } from '~/portfolios/portfolios.module';
import { SettlementsModule } from '~/settlements/settlements.module';
import { SigningModule } from '~/signing/signing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000),
        POLYMESH_NODE_URL: Joi.required(),
        POLYMESH_MIDDLEWARE_URL: Joi.string(),
        POLYMESH_MIDDLEWARE_API_KEY: Joi.string(),
        LOCAL_SIGNERS: Joi.string().allow(''),
        LOCAL_MNEMONICS: Joi.string().allow(''),
        VAULT_TOKEN: Joi.string().allow(''),
        VAULT_URL: Joi.string().allow(''),
      })
        .and('POLYMESH_MIDDLEWARE_URL', 'POLYMESH_MIDDLEWARE_API_KEY')
        .and('LOCAL_SIGNERS', 'LOCAL_MNEMONICS')
        .and('VAULT_TOKEN', 'VAULT_URL'),
    }),
    AssetsModule,
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
  ],
})
export class AppModule {}
