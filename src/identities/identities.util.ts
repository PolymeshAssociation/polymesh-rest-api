/** istanbul ignore file */

import { ModuleName } from '@polymathnetwork/polymesh-sdk/polkadot';
import { Identity, Signer, TxTags } from '@polymathnetwork/polymesh-sdk/types';
import { isAccount } from '@polymathnetwork/polymesh-sdk/utils';
import { flatten } from 'lodash';

import { AccountModel } from '~/identities/models/account.model';
import { IdentitySignerModel } from '~/identities/models/identity-signer.model';
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
    primaryKey: primaryKey.address,
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
  if (isAccount(signer)) {
    return new AccountModel({
      address: signer.address,
    });
  }
  return new IdentitySignerModel({
    did: signer.did,
  });
}

export function getTxTags(): string[] {
  return flatten(Object.values(TxTags).map(txTag => Object.values(txTag)));
}

export function getTxTagsWithModuleNames(): string[] {
  const txTags = getTxTags();
  const moduleNames = Object.values(ModuleName);
  return [...moduleNames, ...txTags];
}
