/* istanbul ignore file */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { FireblocksSigningManager } from '@polymeshassociation/fireblocks-signing-manager';
import { HashicorpVaultSigningManager } from '@polymeshassociation/hashicorp-vault-signing-manager';
import { LocalSigningManager } from '@polymeshassociation/local-signing-manager';

import { LoggerModule } from '~/logger/logger.module';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import signersConfig from '~/signing/config/signers.config';
import { LocalSigningService, SigningService } from '~/signing/services';
import { FireblocksSigningService } from '~/signing/services/fireblocks-signing.service';
import { VaultSigningService } from '~/signing/services/vault-signing.service';
import { SigningController } from '~/signing/signing.controller';

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
        const { vault, local, fireblocks } = configuration;
        if (vault) {
          const manager = new HashicorpVaultSigningManager(vault);
          service = new VaultSigningService(manager, polymeshService, logger);
          await service.initialize();
        } else if (fireblocks) {
          const manager = await FireblocksSigningManager.create(fireblocks);
          service = new FireblocksSigningService(manager, polymeshService, logger);
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
  controllers: [SigningController],
})
export class SigningModule {}
