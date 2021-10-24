/* istanbul ignore file */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { Keyring, Polymesh } from '@polymathnetwork/polymesh-sdk';

import { LoggerModule } from '~/logger/logger.module';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import polymeshConfig from '~/polymesh/config/polymesh.config';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { VaultSigner } from '~/polymesh/vault-signer';
import { RelayerAccountsModule } from '~/relayer-accounts/relayer-accounts.module';
import { RelayerAccountsService } from '~/relayer-accounts/relayer-accounts.service';
import { VaultModule } from '~/vault/vault.module';
import { VaultService } from '~/vault/vault.service';

@Module({
  imports: [
    ConfigModule.forFeature(polymeshConfig),
    RelayerAccountsModule,
    VaultModule,
    LoggerModule,
  ],
  providers: [
    PolymeshService,
    {
      provide: POLYMESH_API,
      useFactory: async (
        configuration: ConfigType<typeof polymeshConfig>,
        vaultService: VaultService,
        relayerAccountsService: RelayerAccountsService,
        logger: PolymeshLogger
      ): Promise<Polymesh> => {
        // To use a custom signer, the SDK instance still needs the address in its keyring. This can only be done during initialization.
        // Once the SDK has support for adding custom signers dynamically this code can be cleaned up.
        const vaultKeys = vaultService.listKeys();
        const vaultConfiged = Object.keys(vaultKeys).length > 0;
        if (vaultConfiged) {
          /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
          configureKeyring(vaultKeys, relayerAccountsService, configuration.keyring!);
        } else {
          delete configuration.keyring;
        }
        const polymeshApi = await Polymesh.connect(configuration);
        if (vaultConfiged) {
          const promiseApi = polymeshApi._polkadotApi;
          const vaultSigner = new VaultSigner(vaultService, polymeshApi._polkadotApi);
          promiseApi.setSigner(vaultSigner);

          if (process.env.RELAYER_DIDS) {
            logger.warn('RELAYER_DIDS was set alongside Vault configuration and will be ignored');
          }
        } else {
          configureMnemonicSigner(polymeshApi, relayerAccountsService);
        }

        return polymeshApi;
      },
      inject: [polymeshConfig.KEY, VaultService, RelayerAccountsService, PolymeshLogger],
    },
  ],
  exports: [PolymeshService],
})
export class PolymeshModule {}

function configureKeyring(
  vaultKeys: Record<string, string>,
  relayerAccountsService: RelayerAccountsService,
  keyring: Keyring
): void {
  for (const key in vaultKeys) {
    keyring.addFromAddress(key);
    relayerAccountsService.setAddress(vaultKeys[key], key);
  }
}

function configureMnemonicSigner(
  polymeshApi: Polymesh,
  relayerAccountsService: RelayerAccountsService
): void {
  const { RELAYER_DIDS, RELAYER_MNEMONICS } = process.env;
  const dids = RELAYER_DIDS?.split(',') || [];
  const mnemonics = RELAYER_MNEMONICS?.split(',') || [];
  if (dids.length !== mnemonics.length) {
    throw new Error(
      'RELAYER_DIDS and RELAYER_MNEMONICS must have the same number of comma separated items'
    );
  }
  mnemonics.forEach((mnemonic, index) => {
    const { address: account } = polymeshApi.addSigner({ accountMnemonic: mnemonic });
    relayerAccountsService.setAddress(dids[index], account);
  });
}
