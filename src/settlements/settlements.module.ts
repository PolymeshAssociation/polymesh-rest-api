/* istanbul ignore file */

import { forwardRef, Module } from '@nestjs/common';

import { AssetsModule } from '~/assets/assets.module';
import { IdentitiesModule } from '~/identities/identities.module';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { SettlementsController } from '~/settlements/settlements.controller';
import { SettlementsService } from '~/settlements/settlements.service';
import { TransactionsModule } from '~/transactions/transactions.module';

@Module({
  imports: [
    TransactionsModule,
    forwardRef(() => IdentitiesModule),
    PolymeshModule,
    forwardRef(() => AssetsModule),
  ],
  providers: [SettlementsService],
  exports: [SettlementsService],
  controllers: [SettlementsController],
})
export class SettlementsModule {}
