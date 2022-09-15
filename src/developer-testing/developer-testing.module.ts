import { DynamicModule, Module } from '@nestjs/common';

import { DeveloperTestingController } from '~/developer-testing/developer-testing.controller';
import { LoggerModule } from '~/logger/logger.module';

@Module({})
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
      imports: [LoggerModule],
      controllers,
      providers: [],
    };
  }
}
