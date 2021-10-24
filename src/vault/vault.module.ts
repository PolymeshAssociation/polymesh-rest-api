import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';

import vaultConfig from '~/vault/config/vault.config';
import { VaultService } from '~/vault/vault.service';

@Module({
  imports: [ConfigModule.forFeature(vaultConfig)],
  providers: [
    {
      provide: VaultService,
      useFactory: async (configuration: ConfigType<typeof vaultConfig>): Promise<VaultService> => {
        const vaultService = new VaultService(configuration);
        await vaultService.init();
        return vaultService;
      },
      inject: [vaultConfig.KEY],
    },
  ],
  exports: [VaultService],
})
export class VaultModule {}
