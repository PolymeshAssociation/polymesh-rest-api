/* istanbul ignore file */

import { HttpModule } from '@nestjs/axios';
import { DynamicModule, forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ConfidentialProofsController } from '~/confidential-proofs/confidential-proofs.controller';
import { ConfidentialProofsService } from '~/confidential-proofs/confidential-proofs.service';
import confidentialProofsConfig from '~/confidential-proofs/config/confidential-proofs.config';
import { ConfidentialTransactionsModule } from '~/confidential-transactions/confidential-transactions.module';
import { LoggerModule } from '~/logger/logger.module';

@Module({})
export class ConfidentialProofsModule {
  static register(): DynamicModule {
    const controllers = [];

    const proofServerUrl = process.env.PROOF_SERVER_URL || '';

    if (proofServerUrl.length) {
      controllers.push(ConfidentialProofsController);
    }

    return {
      module: ConfidentialProofsModule,
      imports: [
        ConfigModule.forFeature(confidentialProofsConfig),
        HttpModule,
        LoggerModule,
        forwardRef(() => ConfidentialTransactionsModule),
      ],
      controllers,
      providers: [ConfidentialProofsService],
      exports: [ConfidentialProofsService],
    };
  }
}
