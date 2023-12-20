import { LocalOfflineEventRepo } from '~/datastore/local-store/repos/offline-event.repo';
import { OfflineEventRepo } from '~/offline-recorder/repo/offline-event.repo';

describe(`LocalOfflineEventRepo ${OfflineEventRepo.type} test suite`, () => {
  const repo = new LocalOfflineEventRepo();

  OfflineEventRepo.test(repo);
});
