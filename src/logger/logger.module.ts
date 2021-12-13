/** istanbul ignore file */

import { Module } from '@nestjs/common';

import { PolymeshLogger } from '~/logger/polymesh-logger.service';

@Module({
  providers: [PolymeshLogger],
  exports: [PolymeshLogger],
})
export class LoggerModule {}
