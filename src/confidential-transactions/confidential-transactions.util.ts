import { ConfidentialTransaction } from '@polymeshassociation/polymesh-sdk/types';

import { createConfidentialAccountModel } from '~/confidential-accounts/confidential-accounts.util';
import { createConfidentialAssetModel } from '~/confidential-assets/confidential-assets.util';
import { ConfidentialAssetAuditorModel } from '~/confidential-transactions/models/confidential-asset-auditor.model';
import { ConfidentialLegModel } from '~/confidential-transactions/models/confidential-leg.model';
import { ConfidentialTransactionModel } from '~/confidential-transactions/models/confidential-transaction.model';
import { IdentityModel } from '~/identities/models/identity.model';

export async function createConfidentialTransactionModel(
  transaction: ConfidentialTransaction
): Promise<ConfidentialTransactionModel> {
  const [details, legsData] = await Promise.all([transaction.details(), transaction.getLegs()]);

  const { status, createdAt, venueId, memo } = details;

  const legs = legsData.map(
    ({ id, sender, receiver, assetAuditors, mediators }) =>
      new ConfidentialLegModel({
        id,
        sender: createConfidentialAccountModel(sender),
        receiver: createConfidentialAccountModel(receiver),
        mediators: mediators?.map(({ did }) => new IdentityModel({ did })),
        assetAuditors: assetAuditors.map(
          ({ asset, auditors }) =>
            new ConfidentialAssetAuditorModel({
              asset: createConfidentialAssetModel(asset),
              auditors: auditors.map(auditor => createConfidentialAccountModel(auditor)),
            })
        ),
      })
  );

  return new ConfidentialTransactionModel({
    id: transaction.id,
    venueId,
    memo,
    status,
    createdAt: new Date(createdAt.toNumber()),
    legs,
  });
}
