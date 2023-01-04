/* istanbul ignore file */

import { DynamicModule, Module } from '@nestjs/common';

import { AccountsModule } from '~/accounts/accounts.module';
import { DeveloperTestingController } from '~/developer-testing/developer-testing.controller';
import { DeveloperTestingService } from '~/developer-testing/developer-testing.service';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { SigningModule } from '~/signing/signing.module';

@Module({
  providers: [DeveloperTestingService],
})
export class DeveloperTestingModule {
  static register(): DynamicModule {
    const controllers = [];

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const DEVELOPER_UTILS: boolean = JSON.parse(process.env.DEVELOPER_UTILS!);

    if (DEVELOPER_UTILS) {
      controllers.push(DeveloperTestingController);
    }

    return {
      module: DeveloperTestingModule,
      imports: [PolymeshModule, AccountsModule, SigningModule],
      controllers,
      providers: [],
    };
  }
}
