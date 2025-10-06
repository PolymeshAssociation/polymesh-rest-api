import { when } from 'jest-when';
import { Repository, TypeORMError } from 'typeorm';

import { AppConflictError } from '~/common/errors';
import { User } from '~/datastore/postgres/entities/user.entity';
import { PostgresUsersRepo } from '~/datastore/postgres/repos/users.repo';
import { testValues } from '~/test-utils/consts';
import { MockPostgresRepository } from '~/test-utils/repo-mocks';
import { UsersRepo } from '~/users/repo/user.repo';

const uniqueViolation = new TypeORMError('duplicate key value violates unique constraint');
const { user: testUser } = testValues;

describe(`PostgresUsersRepo ${UsersRepo.type} test suite`, () => {
  const mockRepository = new MockPostgresRepository();
  const repo = new PostgresUsersRepo(mockRepository as unknown as Repository<User>);
  let _id = 1;

  mockRepository.create.mockImplementation(params => params);
  mockRepository.findOneBy.mockResolvedValue(null);

  mockRepository.save.mockImplementation(async user => {
    const { name } = user;
    user.id = _id++;
    when(mockRepository.save)
      .calledWith(expect.objectContaining({ name }))
      .mockRejectedValue(uniqueViolation);
    when(mockRepository.findOneBy).calledWith({ name }).mockResolvedValue(user);
  });

  UsersRepo.test(repo);
});

describe('PostgresApiKeyRepo', () => {
  const mockRepository = new MockPostgresRepository();
  const repo = new PostgresUsersRepo(mockRepository as unknown as Repository<User>);
  const name = testUser.name;
  describe('method: createUser', () => {
    it('should transform TypeORM unique violation into AppConflictError', () => {
      mockRepository.save.mockRejectedValue(uniqueViolation);

      return expect(repo.createUser({ name })).rejects.toThrow(AppConflictError);
    });

    it('should not transform generic TypeORM errors', () => {
      const typeOrmError = new TypeORMError('Test TypeORM error');

      mockRepository.save.mockRejectedValue(typeOrmError);

      return expect(repo.createUser({ name })).rejects.toThrow(typeOrmError);
    });

    it('should throw errors as they are', () => {
      const error = new Error('Testing for when something goes wrong');
      mockRepository.save.mockRejectedValue(error);

      return expect(repo.createUser({ name })).rejects.toThrow(error);
    });
  });
});
