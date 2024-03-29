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

/**
 * mocks TypeORM repository
 */
export class MockPostgresRepository {
  findOneBy = jest.fn();
  save = jest.fn();
  delete = jest.fn();
  create = jest.fn();
}
