import { LocalOfflineTxRepo } from '~/datastore/local-store/repos/offline-tx.repo';
import { OfflineEventRepo } from '~/offline-recorder/repo/offline-event.repo';
import { OfflineTxRepo } from '~/offline-submitter/repos/offline-tx.repo';

describe(`LocalOfflineTxRepo ${OfflineEventRepo.type} test suite`, () => {
  const repo = new LocalOfflineTxRepo();

  OfflineTxRepo.test(repo);
});
