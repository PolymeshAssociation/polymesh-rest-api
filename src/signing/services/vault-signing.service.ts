import { HashicorpVaultSigningManager } from '@polymeshassociation/hashicorp-vault-signing-manager';

import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { SigningService } from '~/signing/services/signing.service';

export class VaultSigningService extends SigningService {
  constructor(
    protected readonly signingManager: HashicorpVaultSigningManager,
    protected readonly polymeshService: PolymeshService,
    private readonly logger: PolymeshLogger
  ) {
    super();
    this.logger.setContext(VaultSigningService.name);
  }

  public override async initialize(): Promise<void> {
    await super.initialize();
    return this.logKeys();
  }

  public async getAddressByHandle(handle: string): Promise<string> {
    const keys = await this.signingManager.getVaultKeys();

    const key = keys.find(({ name, version }) => `${name}-${version}` === handle);
    if (key) {
      this.logKey(handle, key.address);
      return key.address;
    } else {
      this.throwNoSigner(handle);
    }
  }

  public async logKeys(): Promise<void> {
    const keys = await this.signingManager.getVaultKeys();

    keys.forEach(({ name, version, address }) => {
      const keyName = `${name}-${version}`;
      this.logKey(keyName, address);
    });
  }

  private logKey(handle: string, address: string): void {
    this.logger.log(`Key "${handle}" with address "${address}" was loaded`);
  }
}
