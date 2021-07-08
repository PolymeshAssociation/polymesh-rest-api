/* istanbul ignore file: non production code */

// TODO @monitz87: replace with actual database/vault

import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { forEach, map } from 'lodash';

import relayerAccountsConfig from '~/relayer-accounts/config/relayer-accounts.config';

@Injectable()
export class RelayerAccountsService {
  private accounts: Record<
    string,
    {
      address: string;
      mnemonic: string;
    }
  > = {};

  constructor(
    @Inject(relayerAccountsConfig.KEY)
    accountsConfig: ConfigType<typeof relayerAccountsConfig>
  ) {
    const { accounts } = this;

    forEach(accountsConfig, (mnemonic, did) => {
      accounts[did] = {
        mnemonic,
        address: '',
      };
    });
  }

  public findMnemonicByDid(did: string): string {
    return this.accounts[did].mnemonic;
  }

  public findAddressByDid(did: string): string {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.accounts[did].address!;
  }

  public findAll(): { mnemonic: string; address: string; did: string }[] {
    return map(this.accounts, (value, did) => ({
      ...value,
      did,
    }));
  }

  public setAddress(did: string, address: string): void {
    this.accounts[did].address = address;
  }
}
