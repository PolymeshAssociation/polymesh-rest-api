import { forwardRef, Module } from '@nestjs/common';

import { AuthorizationsService } from '~/authorizations/authorizations.service';
import { PortfoliosModule } from '~/portfolios/portfolios.module';

@Module({
  imports: [forwardRef(() => PortfoliosModule)],
  providers: [AuthorizationsService],
  exports: [AuthorizationsService],
  controllers: [],
})
export class AuthorizationsModule {}
