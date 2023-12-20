import { when } from 'jest-when';
import { Repository } from 'typeorm';

import { OfflineTx } from '~/datastore/postgres/entities/offline-tx.entity';
import { PostgresOfflineTxRepo } from '~/datastore/postgres/repos/offline-tx.repo';
import { OfflineTxRepo } from '~/offline-submitter/repos/offline-tx.repo';
import { MockPostgresRepository } from '~/test-utils/repo-mocks';

describe(`PostgresOfflineTxRepo ${OfflineTxRepo.type} test suite`, () => {
  const mockRepository = new MockPostgresRepository();
  const repo = new PostgresOfflineTxRepo(mockRepository as unknown as Repository<OfflineTx>);

  mockRepository.create.mockImplementation(tx => tx);

  mockRepository.save.mockImplementation(async tx => {
    when(mockRepository.findOneBy).calledWith({ id: tx.id }).mockResolvedValue(tx);
  });

  OfflineTxRepo.test(repo);
});
