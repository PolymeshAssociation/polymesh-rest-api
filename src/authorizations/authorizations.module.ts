/* istanbul ignore file */
import { forwardRef, Module } from '@nestjs/common';

import { AuthorizationsService } from '~/authorizations/authorizations.service';
import { IdentitiesModule } from '~/identities/identities.module';
import { PortfoliosModule } from '~/portfolios/portfolios.module';

@Module({
  imports: [forwardRef(() => PortfoliosModule), forwardRef(() => IdentitiesModule)],
  providers: [AuthorizationsService],
  exports: [AuthorizationsService],
  controllers: [],
})
export class AuthorizationsModule {}
