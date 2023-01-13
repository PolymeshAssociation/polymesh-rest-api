import { FireblocksSigningManager } from '@polymeshassociation/fireblocks-signing-manager';
import { DerivationPath } from '@polymeshassociation/fireblocks-signing-manager/lib/fireblocks';

import { AppValidationError } from '~/common/errors';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { SigningService } from '~/signing/services';
import { determineBip44CoinType } from '~/signing/services/util';

export class FireblocksSigningService extends SigningService {
  constructor(
    protected readonly signingManager: FireblocksSigningManager,
    protected readonly polymeshService: PolymeshService,
    private readonly logger: PolymeshLogger
  ) {
    super();
    this.logger.setContext(FireblocksSigningService.name);
  }

  public async getAddressByHandle(handle: string): Promise<string> {
    const derivePath = this.handleToDerivationPath(handle);

    const key = await this.signingManager.deriveAccount(derivePath);
    return key.address;
  }

  private handleToDerivationPath(handle: string): DerivationPath {
    const sections = handle.split('-').map(Number);

    if (sections.some(isNaN) || sections.length > 3 || handle === '') {
      throw new AppValidationError(
        'Fireblocks `signer` field should be 3 integers formatted like: `x-y-z`'
      );
    }

    const coinType = determineBip44CoinType(this.signingManager.ss58Format);

    const [accountId, change, accountIndex] = sections;

    return [44, coinType, accountId, change || 0, accountIndex || 0];
  }
}
