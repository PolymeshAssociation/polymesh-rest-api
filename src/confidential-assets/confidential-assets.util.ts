/* istanbul ignore file */

import { ConfidentialAsset } from '@polymeshassociation/polymesh-sdk/types';

import { ConfidentialAccountModel } from '~/confidential-accounts/models/confidential-account.model';
import { ConfidentialAssetModel } from '~/confidential-assets/models/confidential-asset.model';
import { ConfidentialAssetDetailsModel } from '~/confidential-assets/models/confidential-asset-details.model';
import { IdentityModel } from '~/identities/models/identity.model';

/**
 * Fetch and assemble data for an Confidential Asset
 */
export async function createConfidentialAssetDetailsModel(
  asset: ConfidentialAsset
): Promise<ConfidentialAssetDetailsModel> {
  const [details, { auditors, mediators }, isFrozen] = await Promise.all([
    asset.details(),
    asset.getAuditors(),
    asset.isFrozen(),
  ]);

  return new ConfidentialAssetDetailsModel({
    ...details,
    isFrozen,
    auditors: auditors.map(({ publicKey }) => new ConfidentialAccountModel({ publicKey })),
    mediators: mediators.map(({ did }) => new IdentityModel({ did })),
  });
}

export function createConfidentialAssetModel(asset: ConfidentialAsset): ConfidentialAssetModel {
  const { id } = asset;

  return new ConfidentialAssetModel({ id });
}
