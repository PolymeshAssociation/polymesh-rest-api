/* istanbul ignore file */

import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AccountsModule } from '~/accounts/accounts.module';
import { isDeveloperUtilsEnabled } from '~/common/utils/feature-flags';
import { DeveloperTestingController } from '~/developer-testing/developer-testing.controller';
import { DeveloperTestingService } from '~/developer-testing/developer-testing.service';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { SigningModule } from '~/signing/signing.module';
import { TransactionsModule } from '~/transactions/transactions.module';

@Module({})
export class DeveloperTestingModule {
  static register(): DynamicModule {
    const controllers = isDeveloperUtilsEnabled() ? [DeveloperTestingController] : [];

    return {
      module: DeveloperTestingModule,
      imports: [PolymeshModule, AccountsModule, SigningModule, TransactionsModule, ConfigModule],
      controllers,
      providers: [DeveloperTestingService],
      exports: [DeveloperTestingService],
    };
  }
}
