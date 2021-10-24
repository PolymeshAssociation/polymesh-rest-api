import { Injectable } from '@nestjs/common';
import { ApiPromise } from '@polkadot/api';
import { SignerPayloadJSON, SignerResult } from '@polkadot/types/types';

import { VaultService } from '~/vault/vault.service';

@Injectable()
export class VaultSigner {
  private id = 0;
  constructor(private readonly vaultClient: VaultService, private api: ApiPromise) {}

  public async signPayload(payload: SignerPayloadJSON): Promise<SignerResult> {
    const address = payload.address;

    const apiPayload = this.api.createType('ExtrinsicPayload', payload, {
      version: payload.version,
    });

    const body = {
      input: Buffer.from(apiPayload.toU8a(true)).toString('base64'),
    };

    return this.vaultClient.sign(body, address, ++this.id);
  }
}
