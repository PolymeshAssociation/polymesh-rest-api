/* istanbul ignore file */

import { forwardRef, Module } from '@nestjs/common';

import { AuthorizationsService } from '~/authorizations/authorizations.service';
import { IdentitiesModule } from '~/identities/identities.module';

@Module({
  imports: [forwardRef(() => IdentitiesModule)],
  providers: [AuthorizationsService],
  exports: [AuthorizationsService],
})
export class AuthorizationsModule {}
