/** istanbul ignore file */

import { Identity, Signer } from '@polymeshassociation/polymesh-sdk/types';
import { isAccount } from '@polymeshassociation/polymesh-sdk/utils';

import { createPermissionedAccountModel } from '~/accounts/accounts.util';
import { AccountModel } from '~/identities/models/account.model';
import { IdentityDetailsModel } from '~/identities/models/identity-details.model';
import { IdentitySignerModel } from '~/identities/models/identity-signer.model';
import { SignerModel } from '~/identities/models/signer.model';

/**
 * Fetch and assemble data for an Identity
 */
export async function createIdentityModel(identity: Identity): Promise<IdentityDetailsModel> {
  const [primaryAccount, secondaryAccountsFrozen, { data: secondaryAccounts }] = await Promise.all([
    identity.getPrimaryAccount(),
    identity.areSecondaryAccountsFrozen(),
    identity.getSecondaryAccounts(),
  ]);
  return new IdentityDetailsModel({
    did: identity.did,
    primaryAccount: createPermissionedAccountModel(primaryAccount),
    secondaryAccountsFrozen,
    secondaryAccounts: secondaryAccounts.map(createPermissionedAccountModel),
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
