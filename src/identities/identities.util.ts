/** istanbul ignore file */

import { ApiTypes, AugmentedSubmittable, SubmittableExtrinsic } from '@polkadot/api/types';
import { AccountId, Call } from '@polkadot/types/interfaces';
import { Identity, Signer } from '@polymathnetwork/polymesh-sdk/types';
import { isAccount } from '@polymathnetwork/polymesh-sdk/utils';

import { createPermissionedAccountModel } from '~/accounts/accounts.util';
import { AccountModel } from '~/identities/models/account.model';
import { IdentitySignerModel } from '~/identities/models/identity-signer.model';
import { IdentityModel } from '~/identities/models/identity.model';
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

export type PolkadotTransaction =
  | AugmentedSubmittable<
      (targetAccount: AccountId | string) => SubmittableExtrinsic<ApiTypes>,
      [AccountId]
    >
  | AugmentedSubmittable<
      (
        call:
          | Call
          | {
              /* eslint-disable @typescript-eslint/no-explicit-any */
              callIndex?: any;
              args?: any;
              /* eslint-enable @typescript-eslint/no-explicit-any */
            }
          | string
          | Uint8Array
      ) => SubmittableExtrinsic<ApiTypes>,
      [Call]
    >;
