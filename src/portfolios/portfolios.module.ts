/* istanbul ignore file */

import { forwardRef, Module } from '@nestjs/common';

import { IdentitiesModule } from '~/identities/identities.module';
import { LoggerModule } from '~/logger/logger.module';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PortfoliosController } from '~/portfolios/portfolios.controller';
import { PortfoliosService } from '~/portfolios/portfolios.service';
import { SigningModule } from '~/signing/signing.module';
@Module({
  imports: [PolymeshModule, LoggerModule, SigningModule, forwardRef(() => IdentitiesModule)],
  providers: [PortfoliosService],
  exports: [PortfoliosService],
  controllers: [PortfoliosController],
})
export class PortfoliosModule {}
