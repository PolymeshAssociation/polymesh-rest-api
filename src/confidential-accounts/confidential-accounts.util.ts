/* istanbul ignore file */

import { ConfidentialAccount } from '@polymeshassociation/polymesh-sdk/types';

import { ConfidentialAccountModel } from '~/confidential-accounts/models/confidential-account.model';

/**
 * Create a ConfidentialAccountModel from ConfidentialAccount
 */
export function createConfidentialAccountModel(
  account: ConfidentialAccount
): ConfidentialAccountModel {
  const { publicKey } = account;
  return new ConfidentialAccountModel({ publicKey });
}
