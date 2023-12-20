import { when } from 'jest-when';
import { Repository } from 'typeorm';

import { ApiKeyRepo } from '~/auth/repos/api-key.repo';
import { ApiKey } from '~/datastore/postgres/entities/api-key.entity';
import { PostgresApiKeyRepo } from '~/datastore/postgres/repos/api-keys.repo';
import { testValues } from '~/test-utils/consts';
import { MockPostgresRepository } from '~/test-utils/repo-mocks';

const { user } = testValues;

describe(`PostgresApiKeyRepo ${ApiKeyRepo.type} test suite`, () => {
  const mockRepository = new MockPostgresRepository();
  const repo = new PostgresApiKeyRepo(mockRepository as unknown as Repository<ApiKey>);
  let _id = 1;

  when(mockRepository.create).mockImplementation(secret => {
    when(mockRepository.findOneBy).calledWith({ secret }).mockResolvedValue({ user, id: _id++ });
    return { secret, user };
  });

  mockRepository.delete.mockImplementation(({ secret }) => {
    when(mockRepository.findOneBy).calledWith({ secret }).mockResolvedValue(null);
  });

  ApiKeyRepo.test(repo);
});
