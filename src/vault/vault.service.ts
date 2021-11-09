import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { SignerResult } from '@polkadot/types/types';
import { encodeAddress } from '@polkadot/util-crypto';
import { toNumber } from 'lodash';

import vaultConfig from '~/vault/config/vault.config';

interface SignPayload {
  input: string;
}

interface SignResponse {
  data: {
    signature: string;
  };
}

interface Key {
  // eslint-disable-next-line camelcase
  public_key: string;
}

interface FetchKeyResponse {
  data: {
    keys: { [key: string]: Key };
  };
}

/**
 * VaultService wraps a vault instance. Used by the vault signer.
 */
@Injectable()
export class VaultService {
  public client; // marked as public so the test can mock the call
  private ss58Format = 42;
  private keys: string[] = [];
  private addressToNameMap: Record<string, string> = {}; // lets us find the vault key name from the signer address

  constructor(
    @Inject(vaultConfig.KEY)
    private configuration: ConfigType<typeof vaultConfig>
  ) {
    this.client = configuration.client;
    this.ss58Format = configuration.ss58Format;
    this.keys = configuration.vaultKeys;
  }

  /**
   * Fetches the public key and translates it into an SS58 representation
   */
  async init(): Promise<void> {
    const promises: Promise<void>[] = [];
    this.keys.forEach(key => {
      promises.push(
        (async () => {
          const address = await this.fetchKey(key);
          this.addressToNameMap[address] = key;
        })()
      );
    });
    await Promise.all(promises);
  }

  listKeys(): Record<string, string> {
    return this.addressToNameMap;
  }

  isConfigured(): boolean {
    return Object.keys(this.addressToNameMap).length > 0;
  }

  async sign(body: SignPayload, address: string, id: number): Promise<SignerResult> {
    const name = this.addressToNameMap[address];
    return this.client.post<SignResponse>(`/sign/${name}`, body).then(response => {
      const rawSignature = response.data.data.signature;
      if (!rawSignature) {
        throw new InternalServerErrorException('could not sign payload');
      }
      // strip vault prefix
      const noPrefix = rawSignature.replace(/vault:v\d+:/, '');
      // convert to hex and prepend 00 to indicate this is a ed25519 signature
      const buffer = Buffer.from(noPrefix, 'base64');
      const signature = `0x00${buffer.toString('hex')}`;

      return { signature, id };
    });
  }

  // given a name returns the public key encoded into the SS58 address
  private async fetchKey(name: string): Promise<string> {
    return this.client
      .get<FetchKeyResponse>(`/keys/${name}`)
      .then(response => {
        // each key can have different versions, this finds the latest version
        const latestVersion = Math.max(
          ...Object.keys(response.data.data.keys).map(toNumber)
        ).toString();
        const latestKey = response.data.data.keys[latestVersion];
        // now encode it as ss58Format
        const hexKey = Buffer.from(latestKey.public_key, 'base64');
        return encodeAddress(hexKey, this.ss58Format);
      })
      .catch(err => {
        throw new Error(`Could not fetch public key for: "${name}". Error: ${err.message}`);
      });
  }
}
