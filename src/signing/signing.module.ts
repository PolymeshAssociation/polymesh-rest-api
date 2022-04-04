/* istanbul ignore file */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { HashicorpVaultSigningManager } from '@polymathnetwork/hashicorp-vault-signing-manager';
import { LocalSigningManager } from '@polymathnetwork/local-signing-manager';

import { LoggerModule } from '~/logger/logger.module';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import signersConfig from '~/signing/config/signers.config';
import {
  LocalSigningService,
  SigningService,
  VaultSigningService,
} from '~/signing/signing.service';

@Module({
  imports: [ConfigModule.forFeature(signersConfig), PolymeshModule, LoggerModule],
  providers: [
    {
      provide: SigningService,
      inject: [PolymeshService, signersConfig.KEY, PolymeshLogger],
      useFactory: async (
        polymeshService: PolymeshService,
        configuration: ConfigType<typeof signersConfig>,
        logger: PolymeshLogger
      ): Promise<SigningService> => {
        let service;
        const { vault, local } = configuration;
        if (vault) {
          const manager = new HashicorpVaultSigningManager(vault);
          service = new VaultSigningService(manager, polymeshService, logger);
          await service.initialize();
        } else {
          const manager = await LocalSigningManager.create({ accounts: [] });
          service = new LocalSigningService(manager, polymeshService, logger);
          await service.initialize(local);
        }
        return service;
      },
    },
  ],
  exports: [SigningService],
})
export class SigningModule {}
