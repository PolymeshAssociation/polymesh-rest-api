/* istanbul ignore file */

import { forwardRef, Module } from '@nestjs/common';

import { AuthorizationsController } from '~/authorizations/authorizations.controller';
import { AuthorizationsService } from '~/authorizations/authorizations.service';
import { IdentitiesModule } from '~/identities/identities.module';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { SigningModule } from '~/signing/signing.module';

@Module({
  imports: [PolymeshModule, SigningModule, forwardRef(() => IdentitiesModule)],
  providers: [AuthorizationsService],
  exports: [AuthorizationsService],
  controllers: [AuthorizationsController],
})
export class AuthorizationsModule {}
