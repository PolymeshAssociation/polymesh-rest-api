/** istanbul ignore file */

import { Account } from '@polymathnetwork/polymesh-sdk/internal';
import { Identity, Signer } from '@polymathnetwork/polymesh-sdk/types';

import { AccountModel } from '~/identities/models/account.model';
import { IdentityModel } from '~/identities/models/identity.model';
import { SecondaryKeyModel } from '~/identities/models/secondary-key.model';
import { SignerModel } from '~/identities/models/signer.model';

/**
 * Method to parse identity from SDK
 */
export async function parseIdentity(identity: Identity): Promise<IdentityModel> {
  const identityModel = new IdentityModel();
  identityModel.primaryKey = await identity.getPrimaryKey();
  identityModel.secondaryKeysFrozen = await identity.areSecondaryKeysFrozen();
  const secondaryKeys = await identity.getSecondaryKeys();
  if (secondaryKeys?.length > 0) {
    identityModel.secondaryKeys = [];
    for (const sk of secondaryKeys) {
      const secondaryKey = new SecondaryKeyModel();
      secondaryKey.signer = parseSigner(sk.signer);
      identityModel.secondaryKeys.push(secondaryKey);
    }
  }
  return identityModel;
}

/**
 * Method to parse signer based on account/identity
 */
export function parseSigner(signer: Signer): SignerModel {
  if (signer instanceof Account) {
    return new AccountModel({
      address: signer.address,
    });
  }
  return new IdentityModel({
    did: signer.did,
  });
}
