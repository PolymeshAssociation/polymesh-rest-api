import { Module } from '@nestjs/common';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';

import { LoggerModule } from '~/logger/logger.module';
import { ScheduleService } from '~/schedule/schedule.service';

/**
 * Scheduler module to allow better control over errors in scheduled tasks
 */
@Module({
  imports: [NestScheduleModule.forRoot(), LoggerModule],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule {}
