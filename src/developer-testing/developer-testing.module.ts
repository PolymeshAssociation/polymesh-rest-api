import { Module } from '@nestjs/common';

import { DeveloperTestingController } from '~/developer-testing/developer-testing.controller';
import { LoggerModule } from '~/logger/logger.module';

@Module({
  imports: [LoggerModule],
  controllers: [DeveloperTestingController],
  providers: [],
})
export class DeveloperTestingModule {}
