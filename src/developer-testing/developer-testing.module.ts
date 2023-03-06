/* istanbul ignore file */

import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AccountsModule } from '~/accounts/accounts.module';
import { DeveloperTestingController } from '~/developer-testing/developer-testing.controller';
import { DeveloperTestingService } from '~/developer-testing/developer-testing.service';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { SigningModule } from '~/signing/signing.module';

@Module({})
export class DeveloperTestingModule {
  static register(): DynamicModule {
    const controllers = [];

    const DEVELOPER_UTILS: boolean = JSON.parse(`${!!process.env.DEVELOPER_UTILS}`);

    if (DEVELOPER_UTILS) {
      controllers.push(DeveloperTestingController);
    }

    return {
      module: DeveloperTestingModule,
      imports: [PolymeshModule, AccountsModule, SigningModule, ConfigModule],
      controllers,
      providers: [DeveloperTestingService],
      exports: [DeveloperTestingService],
    };
  }
}
