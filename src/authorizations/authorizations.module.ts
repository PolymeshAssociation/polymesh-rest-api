/* istanbul ignore file */

import { forwardRef, Module } from '@nestjs/common';

import { AccountsModule } from '~/accounts/accounts.module';
import { AuthorizationsController } from '~/authorizations/authorizations.controller';
import { AuthorizationsService } from '~/authorizations/authorizations.service';
import { IdentitiesModule } from '~/identities/identities.module';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { TransactionsModule } from '~/transactions/transactions.module';

@Module({
  imports: [PolymeshModule, TransactionsModule, forwardRef(() => IdentitiesModule), AccountsModule],
  providers: [AuthorizationsService],
  exports: [AuthorizationsService],
  controllers: [AuthorizationsController],
})
export class AuthorizationsModule {}
