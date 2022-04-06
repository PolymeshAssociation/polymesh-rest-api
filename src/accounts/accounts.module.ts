/* istanbul ignore file */

import { Module } from '@nestjs/common';

import { AccountsController } from '~/accounts/accounts.controller';
import { AccountsService } from '~/accounts/accounts.service';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { SigningModule } from '~/signing/signing.module';

@Module({
  imports: [PolymeshModule, SigningModule],
  controllers: [AccountsController],
  providers: [AccountsService],
})
export class AccountsModule {}
