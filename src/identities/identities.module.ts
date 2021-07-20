/* istanbul ignore file */

import { forwardRef, Module } from '@nestjs/common';

import { AuthorizationsModule } from '~/authorizations/authorizations.module';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PortfoliosModule } from '~/portfolios/portfolios.module';
import { SettlementsModule } from '~/settlements/settlements.module';
import { TokensModule } from '~/tokens/tokens.module';

import { IdentitiesController } from './identities.controller';
import { IdentitiesService } from './identities.service';

@Module({
  imports: [
    PolymeshModule,
    TokensModule,
    forwardRef(() => SettlementsModule),
    forwardRef(() => AuthorizationsModule),
    forwardRef(() => PortfoliosModule),
  ],
  controllers: [IdentitiesController],
  providers: [IdentitiesService],
  exports: [IdentitiesService],
})
export class IdentitiesModule {}
