/* istanbul ignore file */
import { Module } from '@nestjs/common';

import { AssetsModule } from '~/assets/assets.module';
import { IdentitiesModule } from '~/identities/identities.module';
import { PermissionGroupsController } from '~/permission-groups/permission-groups.controller';
import { PermissionGroupsService } from '~/permission-groups/permission-groups.service';
import { TransactionsModule } from '~/transactions/transactions.module';

@Module({
  imports: [TransactionsModule, AssetsModule, IdentitiesModule],
  controllers: [PermissionGroupsController],
  providers: [PermissionGroupsService],
  exports: [PermissionGroupsService],
})
export class PermissionGroupsModule {}
