/* istanbul ignore file */

import { createMock } from '@golevelup/ts-jest';
import { ValueProvider } from '@nestjs/common';

import { ApiKeyRepo } from '~/auth/repos/api-key.repo';
import { UsersRepo } from '~/users/repo/user.repo';

export const mockApiKeyRepoProvider: ValueProvider<ApiKeyRepo> = {
  provide: ApiKeyRepo,
  useValue: createMock<ApiKeyRepo>(),
};

export const mockUserRepoProvider: ValueProvider<UsersRepo> = {
  provide: UsersRepo,
  useValue: createMock<UsersRepo>(),
};

export class MockQueryBuilder {
  update = jest.fn().mockReturnThis();
  set = jest.fn().mockReturnThis();
  where = jest.fn().mockReturnThis();
  execute = jest.fn().mockResolvedValue({ affected: 1 });
}

/**
 * mocks TypeORM repository
 */
export class MockPostgresRepository {
  findOneBy = jest.fn();
  save = jest.fn();
  delete = jest.fn();
  create = jest.fn();
  update = jest.fn();
  find = jest.fn();
  createQueryBuilder = jest.fn().mockReturnValue(new MockQueryBuilder());
}
