/* istanbul ignore file */

import { forwardRef, Module } from '@nestjs/common';

import { IdentitiesModule } from '~/identities/identities.module';
import { PortfoliosController } from '~/portfolios/portfolios.controller';
import { RelayerAccountsModule } from '~/relayer-accounts/relayer-accounts.module';

import { PortfoliosService } from './portfolios.service';

@Module({
  imports: [RelayerAccountsModule, forwardRef(() => IdentitiesModule)],
  providers: [PortfoliosService],
  exports: [PortfoliosService],
  controllers: [PortfoliosController],
})
export class PortfoliosModule {}
