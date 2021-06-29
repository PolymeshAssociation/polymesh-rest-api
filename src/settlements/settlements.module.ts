/* istanbul ignore file */

import { forwardRef, Module } from '@nestjs/common';

import { IdentitiesModule } from '~/identities/identities.module';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { RelayerAccountsModule } from '~/relayer-accounts/relayer-accounts.module';
import { SettlementsController } from '~/settlements/settlements.controller';
import { SettlementsService } from '~/settlements/settlements.service';

@Module({
  imports: [forwardRef(() => IdentitiesModule), RelayerAccountsModule, PolymeshModule],
  providers: [SettlementsService],
  exports: [SettlementsService],
  controllers: [SettlementsController],
})
export class SettlementsModule {}
