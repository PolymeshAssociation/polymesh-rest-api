import { Repository } from 'typeorm';

import { OfflineEvent } from '~/datastore/postgres/entities/offline-event.entity';
import { PostgresOfflineEventRepo } from '~/datastore/postgres/repos/offline-event.repo';
import { OfflineEventRepo } from '~/offline-recorder/repo/offline-event.repo';
import { MockPostgresRepository } from '~/test-utils/repo-mocks';

describe(`PostgresOfflineEventRepo ${OfflineEventRepo.type} test suite`, () => {
  const mockRepository = new MockPostgresRepository();
  const repo = new PostgresOfflineEventRepo(mockRepository as unknown as Repository<OfflineEvent>);

  let _id = 1;

  mockRepository.create.mockReturnValue({ id: _id++ });

  mockRepository.save.mockResolvedValue(null);

  OfflineEventRepo.test(repo);
});
