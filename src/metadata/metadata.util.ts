import { MetadataEntry, MetadataLockStatus } from '@polymeshassociation/polymesh-sdk/types';

import { MetadataDetailsModel } from '~/metadata/models/metadata-details.model';
import { MetadataValueModel } from '~/metadata/models/metadata-value.model';

export async function createMetadataDetailsModel(
  metadataEntry: MetadataEntry
): Promise<MetadataDetailsModel> {
  const {
    id,
    type,
    asset: { id: assetId },
  } = metadataEntry;

  const [{ name, specs }, valueDetails] = await Promise.all([
    metadataEntry.details(),
    metadataEntry.value(),
  ]);

  let metadataValue = null;
  if (valueDetails) {
    const { expiry, lockStatus, value } = valueDetails;

    let lockedUntil;
    if (lockStatus === MetadataLockStatus.LockedUntil) {
      lockedUntil = valueDetails.lockedUntil;
    }

    metadataValue = new MetadataValueModel({
      value: value!,
      expiry: expiry!,
      lockStatus: lockStatus!,
      lockedUntil,
    });
  }

  return new MetadataDetailsModel({ id, type, asset: assetId, name, specs, value: metadataValue });
}
