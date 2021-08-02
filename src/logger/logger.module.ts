/** istanbul ignore file */

import { Module } from '@nestjs/common';

import { PolymeshLogger } from './polymesh-logger.service';

@Module({
  providers: [PolymeshLogger],
  exports: [PolymeshLogger],
})
export class LoggerModule {}
