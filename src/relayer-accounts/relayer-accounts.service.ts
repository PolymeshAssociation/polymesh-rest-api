/* istanbul ignore file: non production code */

// TODO @monitz87: replace with actual database/vault

import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { add, forEach, map } from 'lodash';

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
    const signer = this.accounts[did];
    if (!signer) {
      throw new BadRequestException(`A signer was not found by "${did}"`);
    }
    return signer.address;
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
