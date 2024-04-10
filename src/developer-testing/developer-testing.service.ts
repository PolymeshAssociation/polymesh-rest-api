import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import { Account, Identity } from '@polymeshassociation/polymesh-sdk/types';

import { AccountsService } from '~/accounts/accounts.service';
import { AppInternalError, AppValidationError } from '~/common/errors';
import { isNotNull } from '~/common/utils';
import { CreateMockIdentityDto } from '~/developer-testing/dto/create-mock-identity.dto';
import { CreateTestAccountsDto } from '~/developer-testing/dto/create-test-accounts.dto';
import { CreateTestAdminsDto } from '~/developer-testing/dto/create-test-admins.dto';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { SigningService } from '~/signing/services';

const unitsPerPolyx = 1000000;

@Injectable()
export class DeveloperTestingService {
  private _sudoPair: KeyringPair;

  constructor(
    private readonly polymeshService: PolymeshService,
    private readonly accountsService: AccountsService,
    private readonly signingService: SigningService,
    private readonly configService: ConfigService
  ) {}

  /**
   * @note relies on having a sudo account configured
   */
  public async createTestAdmins({ accounts }: CreateTestAdminsDto): Promise<Identity[]> {
    const identities = await this.createTestAccounts({ accounts });

    await this.createCddProvidersBatch(identities);

    return identities;
  }

  /**
   * @note the `signer` must be a CDD provider and have sufficient POLYX to cover the `initialPolyx`
   */
  public async createTestAccounts({
    accounts,
    signer,
  }: CreateTestAccountsDto): Promise<Identity[]> {
    const {
      _polkadotApi: {
        tx: { utility, balances, identity },
      },
    } = this.polymeshService.polymeshApi;

    const signerAddress = signer
      ? await this.signingService.getAddressByHandle(signer)
      : this.sudoPair.address;

    // Create a DID to attach claim too
    const createDidCalls = accounts.map(({ address }) => identity.cddRegisterDid(address, []));
    await this.polymeshService.execTransaction(signerAddress, utility.batchAtomic, createDidCalls);

    // Fetch the Account and Identity that was made
    const madeAccounts = await this.fetchAccountForAccountParams(accounts);
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

    await this.polymeshService.execTransaction(signerAddress, utility.batchAll, [
      ...createCddCalls,
      ...initialPolyxCalls,
    ]);

    return identities;
  }

  /**
   * @note relies on having a sudo account configured
   */
  private async createCddProvidersBatch(identities: Identity[]): Promise<void> {
    const {
      polymeshService: {
        polymeshApi: {
          _polkadotApi: {
            tx: { cddServiceProviders, sudo, utility },
          },
        },
      },
      sudoPair,
    } = this;

    const cddCalls = identities.map(({ did }) => {
      return cddServiceProviders.addMember(did);
    });

    const batchTx = utility.batchAll(cddCalls);

    await this.polymeshService.execTransaction(sudoPair, sudo.sudo, batchTx);
  }

  private get sudoPair(): KeyringPair {
    if (!this._sudoPair) {
      const sudoMnemonic = this.configService.getOrThrow('DEVELOPER_SUDO_MNEMONIC');
      const ss58Format = this.polymeshService.polymeshApi.network.getSs58Format().toNumber();
      const keyring = new Keyring({ type: 'sr25519', ss58Format });
      this._sudoPair = keyring.addFromUri(sudoMnemonic);
    }

    return this._sudoPair;
  }

  private async fetchAccountForAccountParams(
    accounts: CreateMockIdentityDto[]
  ): Promise<Account[]> {
    return Promise.all(accounts.map(({ address }) => this.accountsService.findOne(address)));
  }

  private async fetchAccountsIdentities(accounts: Account[]): Promise<Identity[]> {
    const potentialIdentities = await Promise.all(accounts.map(account => account.getIdentity()));

    const identities = potentialIdentities.filter(isNotNull);
    if (identities.length !== potentialIdentities.length) {
      throw new AppInternalError('At least one identity was not found which should have been made');
    }

    return identities;
  }

  /**
   * @deprecated Use @link{DeveloperTestingService.createAccount} (the batched version) instead
   * @note intended for development chains only (i.e. Alice exists and can call `testUtils.createMockCddClaim`)
   */
  public async createMockCdd({ address, initialPolyx }: CreateMockIdentityDto): Promise<Identity> {
    const {
      _polkadotApi: {
        tx: { testUtils, balances, sudo },
      },
    } = this.polymeshService.polymeshApi;

    if (!testUtils) {
      throw new AppValidationError(
        'The chain does not have the `testUtils` pallet enabled. This endpoint is intended for development use only'
      );
    }

    const targetAccount = await this.accountsService.findOne(address);

    await this.polymeshService.execTransaction(
      this.sudoPair,
      testUtils.mockCddRegisterDid,
      address
    );
    const setBalance = balances.setBalance(address, initialPolyx.shiftedBy(6).toNumber(), 0);
    await this.polymeshService.execTransaction(this.sudoPair, sudo.sudo, setBalance);

    const id = await targetAccount.getIdentity();

    if (!id) {
      throw new AppInternalError('The Identity was not created');
    }

    return id;
  }
}
