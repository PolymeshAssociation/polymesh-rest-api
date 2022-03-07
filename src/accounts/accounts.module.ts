import { Module } from '@nestjs/common';

import { AccountsController } from '~/accounts/accounts.controller';
import { AccountsService } from '~/accounts/accounts.service';
import { PolymeshModule } from '~/polymesh/polymesh.module';

@Module({
  imports: [PolymeshModule],
  controllers: [AccountsController],
  providers: [AccountsService],
})
export class AccountsModule {}
