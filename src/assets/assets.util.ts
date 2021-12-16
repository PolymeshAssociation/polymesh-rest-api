/* istanbul ignore file */

import { SecurityToken } from '@polymathnetwork/polymesh-sdk/types';

import { AssetDetailsModel } from '~/assets/models/asset-details.model';

/**
 * Fetch and assemble data for an Asset
 */
export async function createAssetDetailsModel(asset: SecurityToken): Promise<AssetDetailsModel> {
  const [
    { owner, assetType, name, totalSupply, isDivisible },
    identifiers,
    fundingRound,
  ] = await Promise.all([asset.details(), asset.getIdentifiers(), asset.currentFundingRound()]);

  return new AssetDetailsModel({
    owner,
    assetType,
    name,
    totalSupply,
    isDivisible,
    identifiers,
    fundingRound,
  });
}
