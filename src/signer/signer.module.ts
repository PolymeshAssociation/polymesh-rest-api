/* istanbul ignore file */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { HashicorpVaultSigningManager } from '@polymathnetwork/hashicorp-vault-signing-manager';
import { LocalSigningManager } from '@polymathnetwork/local-signing-manager';

import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import signersConfig from '~/signer/config/signers.config';
import { SignerService } from '~/signer/signer.service';

@Module({
  imports: [ConfigModule.forFeature(signersConfig), PolymeshModule],
  providers: [
    {
      provide: SignerService,
      inject: [PolymeshService, signersConfig.KEY],
      useFactory: async (
        polymeshService: PolymeshService,
        configuration: ConfigType<typeof signersConfig>
      ): Promise<SignerService> => {
        let service;
        if (configuration.vault) {
          const manager = new HashicorpVaultSigningManager(configuration.vault);
          service = new SignerService(manager, polymeshService);
          await service.loadAccounts({});
        } else {
          const manager = await LocalSigningManager.create({ accounts: [] });
          service = new SignerService(manager, polymeshService);
          await service.loadAccounts(configuration.local);
        }

        return service;
      },
    },
  ],
  exports: [SignerService],
})
export class SignerModule {}
