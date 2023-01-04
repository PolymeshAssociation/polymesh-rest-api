/* istanbul ignore file */

import { Injectable } from '@nestjs/common';
import { SubmittableExtrinsic } from '@polkadot/api-base/types';
import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import { Account, Identity } from '@polymeshassociation/polymesh-sdk/types';

import { AccountsService } from '~/accounts/accounts.service';
import { AppInternalError } from '~/common/errors';
import { isNotNull } from '~/common/utils';
import { CreateCddProviders } from '~/developer-testing/dto/create-admin.dto';
import { CreateMockIdentityBatchDto } from '~/developer-testing/dto/create-mock-identity-batch';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { SigningService } from '~/signing/services';

const unitsPerPolyx = 1000000;
const initialAdminPolyx = 100000000 * unitsPerPolyx;

@Injectable()
export class DeveloperTestingService {
  private _alicePair: KeyringPair;

  constructor(
    private readonly polymeshService: PolymeshService,
    private readonly accountsService: AccountsService,
    private readonly signingService: SigningService
  ) {}

  /**
   * @note the `signer` must be a CDD provider and have sufficient POLYX to cover the `initialPolyx`
   */
  public async batchCddClaimsWithSigner({
    accounts,
    signer,
  }: CreateMockIdentityBatchDto): Promise<Identity[]> {
    const {
      _polkadotApi: {
        tx: { utility, balances, identity },
      },
    } = this.polymeshService.polymeshApi;

    // The external signer does not need to be set after v19-alpha.3 is merged into beta
    const externalSigner = this.signingService.getSigningManager().getExternalSigner();
    this.polymeshService.polymeshApi._polkadotApi.setSigner(externalSigner);

    const signerAddress = await this.signingService.getAddressByHandle(signer);
    const addresses = accounts.map(({ address }) => address);

    // Create a DID to attach claim too
    const createDidCalls = addresses.map(address => identity.cddRegisterDid(address, []));
    await this.polymeshService.execTransaction(signerAddress, utility.batchAtomic, createDidCalls);

    // Fetch the Account and Identity that was made
    const madeAccounts = await this.fetchAccountsForAddresses(addresses);
    const identities = await this.fetchAccountsIdentities(madeAccounts);

    // Now create a CDD claim for each Identity
    const createCddCalls = identities.map(({ did }) =>
      identity.addClaim(did, { CustomerDueDiligence: did }, null)
    );

    // and provide POLYX for those that are supposed to get some
    const initialPolyxCalls = accounts
      .filter(({ initialPolyx }) => initialPolyx.gt(0))
      .map(({ address, initialPolyx }) =>
        balances.transfer(address, initialPolyx.toNumber() * unitsPerPolyx)
      );

    await this.polymeshService.execTransaction(signerAddress, utility.batchAtomic, [
      ...createCddCalls,
      ...initialPolyxCalls,
    ]);

    return identities;
  }

  /**
   * @note relies on `//Alice` having `sudo` permission
   */
  public async batchCreateCddProviders(identities: Identity[]): Promise<void> {
    const {
      polymeshService: {
        polymeshApi: {
          _polkadotApi: {
            tx: { cddServiceProviders, sudo, utility },
          },
        },
      },
      alicePair,
    } = this;
    const cddCalls: SubmittableExtrinsic<'promise'>[] = [];

    identities.forEach(({ did }) => {
      const addCddProviderTx = cddServiceProviders.addMember(did);
      cddCalls.push(addCddProviderTx);
    });

    const batchTx = utility.batchAtomic(cddCalls);

    await this.polymeshService.execTransaction(alicePair, sudo.sudo, batchTx);
  }

  /**
   * @note relies on `//Alice` having `sudo` permission
   */
  public async batchCreateAdmins({ addresses }: CreateCddProviders): Promise<Identity[]> {
    const identities = await this.batchMockCddClaim(addresses);

    await this.batchCreateCddProviders(identities);

    return identities;
  }

  /**
   * @note relies on `//Alice` having `sudo` permission
   */
  public async batchMockCddClaim(addresses: string[]): Promise<Identity[]> {
    const {
      polymeshService: {
        polymeshApi: {
          _polkadotApi: {
            tx: { testUtils, utility, balances, sudo },
          },
        },
      },
      alicePair,
    } = this;

    const cddCalls = addresses.map(address => testUtils.mockCddRegisterDid(address));
    const balanceCalls = addresses.map(address =>
      balances.setBalance(address, initialAdminPolyx, 0)
    );
    const balanceTx = sudo.sudo(utility.batchAtomic(balanceCalls));

    await this.polymeshService.execTransaction(alicePair, utility.batchAtomic, [
      ...cddCalls,
      balanceTx,
    ]);

    await this.polymeshService.execTransaction(alicePair, sudo.sudo, balanceTx);

    const accounts = await this.fetchAccountsForAddresses(addresses);

    return this.fetchAccountsIdentities(accounts);
  }

  private get alicePair(): KeyringPair {
    if (!this._alicePair) {
      const ss58Format = this.polymeshService.polymeshApi.network.getSs58Format().toNumber();
      const keyring = new Keyring({ type: 'sr25519', ss58Format });
      this._alicePair = keyring.addFromUri('//Alice');
    }

    return this._alicePair;
  }

  private async fetchAccountsForAddresses(addresses: string[]): Promise<Account[]> {
    return Promise.all(addresses.map(address => this.accountsService.findOne(address)));
  }

  private async fetchAccountsIdentities(accounts: Account[]): Promise<Identity[]> {
    const potentialIdentities = await Promise.all(accounts.map(account => account.getIdentity()));

    const identities = potentialIdentities.filter(isNotNull);
    if (identities.length !== potentialIdentities.length) {
      throw new AppInternalError('At least one identity was not found which should have been made');
    }

    return identities;
  }
}
