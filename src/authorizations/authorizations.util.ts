/** istanbul ignore file */

import { AuthorizationRequest } from '@polymathnetwork/polymesh-sdk/types';

import { AuthorizationRequestModel } from '~/authorizations/models/authorization-request.model';
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
