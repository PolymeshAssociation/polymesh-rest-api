/* istanbul ignore file */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { HashicorpVaultSigningManager } from '@polymathnetwork/hashicorp-vault-signing-manager';
import { LocalSigningManager } from '@polymathnetwork/local-signing-manager';

import { LoggerModule } from '~/logger/logger.module';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import signersConfig from '~/signer/config/signers.config';
import { SignerService } from '~/signer/signer.service';

@Module({
  imports: [ConfigModule.forFeature(signersConfig), PolymeshModule, LoggerModule],
  providers: [
    {
      provide: SignerService,
      inject: [PolymeshService, signersConfig.KEY, PolymeshLogger],
      useFactory: async (
        polymeshService: PolymeshService,
        configuration: ConfigType<typeof signersConfig>,
        logger: PolymeshLogger
      ): Promise<SignerService> => {
        let service;
        if (configuration.vault) {
          const manager = new HashicorpVaultSigningManager(configuration.vault);
          service = new SignerService(manager, polymeshService, logger);
          await service.loadAccounts();
        } else {
          const manager = await LocalSigningManager.create({ accounts: [] });
          service = new SignerService(manager, polymeshService, logger);
          await service.loadAccounts(configuration.local);
        }

        return service;
      },
    },
  ],
  exports: [SignerService],
})
export class SignerModule {}
