import { LocalOfflineRepo } from '~/datastore/local-store/repos/offline-event.repo';
import { OfflineRepo } from '~/offline-recorder/repo/offline.repo';

describe(`LocalOfflineRepo does not meet ${OfflineRepo.type} test suite requirements`, () => {
  const repo = new LocalOfflineRepo();

  OfflineRepo.test(repo);
});
