/* istanbul ignore file */

import { forwardRef, Module } from '@nestjs/common';

import { AuthorizationsController } from '~/authorizations/authorizations.controller';
import { AuthorizationsService } from '~/authorizations/authorizations.service';
import { IdentitiesModule } from '~/identities/identities.module';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { RelayerAccountsModule } from '~/relayer-accounts/relayer-accounts.module';

@Module({
  imports: [PolymeshModule, RelayerAccountsModule, forwardRef(() => IdentitiesModule)],
  providers: [AuthorizationsService],
  exports: [AuthorizationsService],
  controllers: [AuthorizationsController],
})
export class AuthorizationsModule {}
