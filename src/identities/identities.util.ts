/** istanbul ignore file */

import { Identity, PermissionedAccount, Signer } from '@polymathnetwork/polymesh-sdk/types';
import { isAccount } from '@polymathnetwork/polymesh-sdk/utils';

import { AccountModel } from '~/identities/models/account.model';
import { IdentitySignerModel } from '~/identities/models/identity-signer.model';
import { IdentityModel } from '~/identities/models/identity.model';
import { PermissionedAccountModel } from '~/identities/models/permissioned-account.model';
import { SignerModel } from '~/identities/models/signer.model';

/**
 * Fetch and assemble data for an Identity
 */
export async function createIdentityModel(identity: Identity): Promise<IdentityModel> {
  const [primaryAccount, secondaryAccountsFrozen, secondaryAccounts] = await Promise.all([
    identity.getPrimaryAccount(),
    identity.areSecondaryAccountsFrozen(),
    identity.getSecondaryAccounts(),
  ]);
  return new IdentityModel({
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

export function createPermissionedAccountModel(
  permissionedAccount: PermissionedAccount
): PermissionedAccountModel {
  const {
    account: { address },
    permissions,
  } = permissionedAccount;
  return new PermissionedAccountModel({ account: new AccountModel({ address }), permissions });
}
