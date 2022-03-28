/* istanbul ignore file */

import { Module } from '@nestjs/common';

import { AccountsController } from '~/accounts/accounts.controller';
import { AccountsService } from '~/accounts/accounts.service';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { SignerModule } from '~/signer/signer.module';

@Module({
  imports: [PolymeshModule, SignerModule],
  controllers: [AccountsController],
  providers: [AccountsService],
})
export class AccountsModule {}
