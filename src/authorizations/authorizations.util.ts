/** istanbul ignore file */

import { AuthorizationRequest } from '@polymeshassociation/polymesh-sdk/types';

import { AuthorizationRequestModel } from '~/authorizations/models/authorization-request.model';
import { CreatedAuthorizationRequestModel } from '~/authorizations/models/created-authorization-request.model';
import { TransactionResolver } from '~/common/utils';
import { createSignerModel } from '~/identities/identities.util';

export function createAuthorizationRequestModel(
  authorizationRequest: AuthorizationRequest
): AuthorizationRequestModel {
  const { authId: id, expiry, data, issuer, target } = authorizationRequest;
  return new AuthorizationRequestModel({
    id,
    expiry,
    data,
    issuer,
    target: createSignerModel(target),
  });
}

export const authorizationRequestResolver: TransactionResolver<AuthorizationRequest> = ({
  transactions,
  details,
  result,
}) =>
  new CreatedAuthorizationRequestModel({
    transactions,
    details,
    authorizationRequest: createAuthorizationRequestModel(result),
  });
