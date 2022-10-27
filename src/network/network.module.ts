/* istanbul ignore file */

import { Module } from '@nestjs/common';

import { NetworkController } from '~/network/network.controller';
import { NetworkService } from '~/network/network.service';
import { PolymeshModule } from '~/polymesh/polymesh.module';

/**
 * NetworkModule responsible for the exposing the SDK network namespace
 */
@Module({
  imports: [PolymeshModule],
  providers: [NetworkService],
  exports: [NetworkService],
  controllers: [NetworkController],
})
export class NetworkModule {}
