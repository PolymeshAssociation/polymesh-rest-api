/* istanbul ignore file */

import { Asset } from '@polymeshassociation/polymesh-sdk/types';
import { isFungibleAsset } from '@polymeshassociation/polymesh-sdk/utils';

import { AssetDetailsModel } from '~/assets/models/asset-details.model';

/**
 * Fetch and assemble data for an Asset
 */
export async function createAssetDetailsModel(asset: Asset): Promise<AssetDetailsModel> {
  const [
    { owner, assetType, name, totalSupply, isDivisible, ticker, fullAgents },
    securityIdentifiers,
    fundingRound,
    isFrozen,
  ] = await Promise.all([
    asset.details(),
    asset.getIdentifiers(),
    isFungibleAsset(asset) ? asset.currentFundingRound() : null,
    asset.isFrozen(),
  ]);

  return new AssetDetailsModel({
    ticker,
    owner,
    assetId: asset.id,
    assetType,
    name,
    totalSupply,
    isDivisible,
    securityIdentifiers,
    fundingRound,
    isFrozen,
    agents: fullAgents.map(agent => agent.did),
  });
}
