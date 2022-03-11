/* istanbul ignore file */

import { Asset } from '@polymathnetwork/polymesh-sdk/types';

import { AssetDetailsModel } from '~/assets/models/asset-details.model';

/**
 * Fetch and assemble data for an Asset
 */
export async function createAssetDetailsModel(asset: Asset): Promise<AssetDetailsModel> {
  const [
    { owner, assetType, name, totalSupply, isDivisible },
    securityIdentifiers,
    fundingRound,
  ] = await Promise.all([asset.details(), asset.getIdentifiers(), asset.currentFundingRound()]);

  return new AssetDetailsModel({
    owner,
    assetType,
    name,
    totalSupply,
    isDivisible,
    securityIdentifiers,
    fundingRound,
  });
}
