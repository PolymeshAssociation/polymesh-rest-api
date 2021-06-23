/* istanbul ignore file */

import { Module } from '@nestjs/common';

import { PolymeshModule } from '~/polymesh/polymesh.module';
import { SettlementsService } from '~/settlements/settlements.service';

@Module({
  imports: [PolymeshModule],
  providers: [SettlementsService],
  exports: [SettlementsService],
})
export class SettlementsModule {}
