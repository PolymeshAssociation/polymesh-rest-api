import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAPIObject } from '@nestjs/swagger';
import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Account, Identity } from '@polymeshassociation/polymesh-sdk/types';
import { Request } from 'express';
import { pathToRegexp } from 'path-to-regexp';

import { AccountsService } from '~/accounts/accounts.service';
import { AppInternalError } from '~/common/errors';
import { ProcessMode } from '~/common/types';
import { isNotNull } from '~/common/utils';
import { CreateMockIdentityDto } from '~/developer-testing/dto/create-mock-identity.dto';
import { CreateTestAccountsDto } from '~/developer-testing/dto/create-test-accounts.dto';
import { CreateTestAdminsDto } from '~/developer-testing/dto/create-test-admins.dto';
import { CoverageReportModel } from '~/developer-testing/models/coverage-report.model';
import { PathCoverageRecord } from '~/developer-testing/types';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { SigningService } from '~/signing/services';
import { TransactionsService } from '~/transactions/transactions.service';

const unitsPerPolyx = 1000000;

type PolymeshWithContext = PolymeshService['polymeshApi'] & {
  context: { isV7: boolean };
};

@Injectable()
export class DeveloperTestingService {
  private _sudoPair: KeyringPair;
  private routeRecords: PathCoverageRecord[];

  constructor(
    private readonly polymeshService: PolymeshService,
    private readonly accountsService: AccountsService,
    private readonly signingService: SigningService,
    private readonly transactionsService: TransactionsService,
    private readonly configService: ConfigService
  ) {}

  /**
   * @note relies on having a sudo account configured
   */
  public async createTestAdmins({ accounts }: CreateTestAdminsDto): Promise<Identity[]> {
    const identities = await this.createTestAccounts({ accounts });

    if (this.isChainV7()) {
      await this.createCddProvidersBatch(identities);
    }

    return identities;
  }

  /**
   * @note the `signer` must be a CDD provider and have sufficient POLYX to cover the `initialPolyx`
   */
  public async createTestAccounts({
    accounts,
    signer,
  }: CreateTestAccountsDto): Promise<Identity[]> {
    if (this.isChainV7()) {
      return this.createTestAccountsV7({ accounts, signer });
    }

    return this.createTestAccountsV8({ accounts, signer });
  }

  /**
   * Transfers a small POLYX amount so an account can pay self-registration fees.
   * Uses a raw balance transfer so the receiver does not need an Identity yet.
   */
  public async prefundAccounts({
    accounts,
    signer,
    amount = new BigNumber(100),
  }: CreateTestAccountsDto & { amount?: BigNumber }): Promise<void> {
    const {
      _polkadotApi: {
        tx: { balances },
      },
    } = this.polymeshService.polymeshApi;

    if (!signer) {
      throw new AppInternalError('A signer is required to prefund accounts on chain v8');
    }

    const fundingAddress = await this.signingService.getAddressByHandle(signer);

    for (const { address } of accounts) {
      const { free } = await this.accountsService.getAccountBalance(address);

      if (free.gte(amount)) {
        continue;
      }

      const toTransfer = amount.minus(free);

      await this.polymeshService.execTransaction(
        fundingAddress,
        balances.transferWithMemo,
        address,
        toTransfer.toNumber() * unitsPerPolyx,
        null
      );
    }
  }

  private async createTestAccountsV7({
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
      : this.sudoPair;

    // Create a DID to attach claim too
    const createDidCalls = accounts.map(({ address }) => identity.cddRegisterDid(address, []));
    await this.polymeshService.execTransaction(signerAddress, utility.batch, createDidCalls);

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
        balances.transferWithMemo(address, initialPolyx.toNumber() * unitsPerPolyx, null)
      );

    await this.polymeshService.execTransaction(signerAddress, utility.batchAll, [
      ...createCddCalls,
      ...initialPolyxCalls,
    ]);

    return identities;
  }

  private async createTestAccountsV8({
    accounts,
    signer,
  }: CreateTestAccountsDto): Promise<Identity[]> {
    const accountsWithoutIdentity = await this.findAccountsWithoutIdentity(accounts);

    if (accountsWithoutIdentity.length) {
      await this.prefundNewAccountsForV8(accountsWithoutIdentity, signer);
    }

    await this.selfRegisterNewAccountsForV8(accounts);
    await this.fundAccountsWithInitialPolyxForV8(accounts, signer);

    const madeAccounts = await this.fetchAccountForAccountParams(accounts);

    return this.fetchAccountsIdentities(madeAccounts);
  }

  private async findAccountsWithoutIdentity(
    accounts: CreateTestAccountsDto['accounts']
  ): Promise<CreateTestAccountsDto['accounts']> {
    const accountsWithoutIdentity: CreateTestAccountsDto['accounts'] = [];

    for (const { address } of accounts) {
      const account = await this.accountsService.findOne(address);
      const existingIdentity = await account.getIdentity();

      if (!existingIdentity) {
        accountsWithoutIdentity.push({ address, initialPolyx: new BigNumber(0) });
      }
    }

    return accountsWithoutIdentity;
  }

  private async prefundNewAccountsForV8(
    accountsWithoutIdentity: CreateTestAccountsDto['accounts'],
    signer?: string
  ): Promise<void> {
    if (signer) {
      await this.prefundAccounts({ accounts: accountsWithoutIdentity, signer });

      return;
    }

    await this.sudoPrefundAccounts(accountsWithoutIdentity, new BigNumber(100));
  }

  private async sudoPrefundAccounts(
    accounts: CreateTestAccountsDto['accounts'],
    amount: BigNumber
  ): Promise<void> {
    const {
      _polkadotApi: {
        tx: { balances },
      },
    } = this.polymeshService.polymeshApi;

    for (const { address } of accounts) {
      const { free } = await this.accountsService.getAccountBalance(address);

      if (free.gte(amount)) {
        continue;
      }

      await this.polymeshService.execTransaction(
        this.sudoPair,
        balances.transferWithMemo,
        address,
        amount.minus(free).toNumber() * unitsPerPolyx,
        null
      );
    }
  }

  private async selfRegisterNewAccountsForV8(
    accounts: CreateTestAccountsDto['accounts']
  ): Promise<void> {
    const { selfRegisterDid } = this.polymeshService.polymeshApi.identities;

    for (const { address } of accounts) {
      const account = await this.accountsService.findOne(address);
      const existingIdentity = await account.getIdentity();

      if (existingIdentity) {
        continue;
      }

      const vaultHandle = await this.getVaultHandleForAddress(address);

      if (!vaultHandle) {
        continue;
      }

      await this.transactionsService.submit(selfRegisterDid, undefined, {
        signer: vaultHandle,
        processMode: ProcessMode.Submit,
      });
    }
  }

  private async getVaultHandleForAddress(address: string): Promise<string | undefined> {
    try {
      return await this.signingService.getHandleByAddress(address);
    } catch {
      return undefined;
    }
  }

  private async fundAccountsWithInitialPolyxForV8(
    accounts: CreateTestAccountsDto['accounts'],
    signer?: string
  ): Promise<void> {
    const {
      network,
      _polkadotApi: {
        tx: { balances },
      },
    } = this.polymeshService.polymeshApi;

    const accountsToFund = accounts.filter(({ initialPolyx }) => initialPolyx.gt(0));

    for (const { address, initialPolyx } of accountsToFund) {
      const { free } = await this.accountsService.getAccountBalance(address);

      if (free.gte(initialPolyx)) {
        continue;
      }

      const amountToTransfer = initialPolyx.minus(free);

      if (signer) {
        await this.transactionsService.submit(
          network.transferPolyx,
          { to: address, amount: amountToTransfer },
          { signer, processMode: ProcessMode.Submit }
        );
      } else {
        await this.polymeshService.execTransaction(
          this.sudoPair,
          balances.transferWithMemo,
          address,
          amountToTransfer.toNumber() * unitsPerPolyx,
          null
        );
      }
    }
  }

  private isChainV7(): boolean {
    return (this.polymeshService.polymeshApi as PolymeshWithContext).context.isV7;
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

  public loadSwagger(swaggerDoc: OpenAPIObject): void {
    this.routeRecords = Object.entries(swaggerDoc.paths).map(([path]) => {
      return {
        path,
        // convert swagger syntax
        matcher: pathToRegexp(path.replace(/\{(.*?)\}/g, ':$1')).regexp,
        covered: false,
      };
    });
  }

  public recordRoute(request: Request): void {
    const url = request.url;
    const urlObject = new URL(url, 'http://localhost:2000');

    this.routeRecords.forEach(endpoint => {
      const result = endpoint.matcher.exec(urlObject.pathname);

      if (result) {
        endpoint.covered = true;
      }
    });
  }

  public reportCoverage(): CoverageReportModel {
    const covered = this.routeRecords.filter(path => path.covered);
    const unCovered = this.routeRecords.filter(path => !path.covered);

    const total = new BigNumber(this.routeRecords.length);
    const coverage = new BigNumber((covered.length / total.toNumber()) * 100);
    const uncoveredPaths = unCovered.map(record => record.path);
    const totalUncovered = new BigNumber(uncoveredPaths.length);

    return new CoverageReportModel({ total, totalUncovered, coverage, uncoveredPaths });
  }
}
