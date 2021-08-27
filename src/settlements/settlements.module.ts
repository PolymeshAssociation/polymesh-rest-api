/* istanbul ignore file */

import { forwardRef, Module } from '@nestjs/common';

import { AssetsModule } from '~/assets/assets.module';
import { IdentitiesModule } from '~/identities/identities.module';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { RelayerAccountsModule } from '~/relayer-accounts/relayer-accounts.module';
import { SettlementsController } from '~/settlements/settlements.controller';
import { SettlementsService } from '~/settlements/settlements.service';

@Module({
  imports: [
    forwardRef(() => IdentitiesModule),
    RelayerAccountsModule,
    PolymeshModule,
    forwardRef(() => AssetsModule),
  ],
  providers: [SettlementsService],
  exports: [SettlementsService],
  controllers: [SettlementsController],
})
export class SettlementsModule {}
