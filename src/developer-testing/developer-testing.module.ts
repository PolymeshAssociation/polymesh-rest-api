import { Module } from '@nestjs/common';

import { DeveloperTestingController } from '~/developer-testing/developer-testing.controller';
import { LoggerModule } from '~/logger/logger.module';

const DEVELOPER_UTILS = !!process.env.DEVELOPER_UTILS;

const controllers = [];
if (DEVELOPER_UTILS) {
  controllers.push(DeveloperTestingController);
}
@Module({
  imports: [LoggerModule],
  controllers,
  providers: [],
})
export class DeveloperTestingModule {}
