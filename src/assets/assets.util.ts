/* istanbul ignore file */

import { FungibleAsset } from '@polymeshassociation/polymesh-sdk/types';

import { AssetDetailsModel } from '~/assets/models/asset-details.model';

/**
 * Fetch and assemble data for an Asset
 */
export async function createAssetDetailsModel(asset: FungibleAsset): Promise<AssetDetailsModel> {
  const [
    { owner, assetType, name, totalSupply, isDivisible },
    securityIdentifiers,
    fundingRound,
    isFrozen,
  ] = await Promise.all([
    asset.details(),
    asset.getIdentifiers(),
    asset.currentFundingRound(),
    asset.isFrozen(),
  ]);

  return new AssetDetailsModel({
    owner,
    assetType,
    name,
    totalSupply,
    isDivisible,
    securityIdentifiers,
    fundingRound,
    isFrozen,
  });
}
