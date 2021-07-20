/** istanbul ignore file */

import { Account } from '@polymathnetwork/polymesh-sdk/internal';
import { Identity, Signer } from '@polymathnetwork/polymesh-sdk/types';

import { AccountModel } from '~/identities/models/account.model';
import { IdentityModel } from '~/identities/models/identity.model';
import { SecondaryKeyModel } from '~/identities/models/secondary-key.model';
import { SignerModel } from '~/identities/models/signer.model';

/**
 * Fetch and assemble data for an Identity
 */
export async function createIdentityModel(identity: Identity): Promise<IdentityModel> {
  const [primaryKey, secondaryKeysFrozen, secondaryKeys] = await Promise.all([
    identity.getPrimaryKey(),
    identity.areSecondaryKeysFrozen(),
    identity.getSecondaryKeys(),
  ]);
  return new IdentityModel({
    did: identity.did,
    primaryKey,
    secondaryKeysFrozen,
    secondaryKeys: secondaryKeys.map(
      ({ signer, permissions }) =>
        new SecondaryKeyModel({
          signer: createSignerModel(signer),
          permissions: permissions,
        })
    ),
  });
}

/**
 * Create signer based on account/identity
 */
export function createSignerModel(signer: Signer): SignerModel {
  // TODO @monitz87: replace with typeguard when they are exported from the SDK
  if (signer instanceof Account) {
    return new AccountModel({
      address: signer.address,
    });
  }
  return new IdentityModel({
    did: signer.did,
  });
}
