import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { LoggerModule } from '~/logger/logger.module';
import proofServerConfig from '~/proof-server/config/proof-server.config';
import { ProofServerService } from '~/proof-server/proof-server.service';

@Module({
  imports: [ConfigModule.forFeature(proofServerConfig), HttpModule, LoggerModule],
  providers: [ProofServerService],
  exports: [ProofServerService],
})
export class ProofServerModule {}
