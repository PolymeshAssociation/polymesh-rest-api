/* istanbul ignore file */

import { forwardRef, Module } from '@nestjs/common';

import { IdentitiesModule } from '~/identities/identities.module';

import { PortfoliosService } from './portfolios.service';

@Module({
  imports: [forwardRef(() => IdentitiesModule)],
  providers: [PortfoliosService],
  exports: [PortfoliosService],
})
export class PortfoliosModule {}
