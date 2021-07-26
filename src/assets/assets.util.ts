/* istanbul ignore file */

import { SecurityToken } from '@polymathnetwork/polymesh-sdk/types';

import { AssetDetailsModel } from './models/asset-details.model';

/**
 * Fetch and assemble data for an Asset
 */
export async function createAssetDetailsModel(asset: SecurityToken): Promise<AssetDetailsModel> {
  const [{ owner, assetType, name, totalSupply, isDivisible }, identifiers] = await Promise.all([
    asset.details(),
    asset.getIdentifiers(),
  ]);

  return new AssetDetailsModel({
    owner,
    assetType,
    name,
    totalSupply,
    isDivisible,
    identifiers,
  });
}
