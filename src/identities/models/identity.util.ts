/** istanbul ignore file */

import { Identity } from '@polymeshassociation/polymesh-sdk/types';

import { TransactionResolver } from '~/common/utils';
import { createIdentityModel } from '~/identities/identities.util';
import { CreatedIdentityModel } from '~/identities/models/created-identity.model';

export const createIdentityResolver: TransactionResolver<Identity> = async ({
  transactions,
  details,
  result,
}) => {
  const identity = await createIdentityModel(result);

  return new CreatedIdentityModel({
    transactions,
    details,
    identity,
  });
};
