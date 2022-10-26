import { when } from 'jest-when';
import { Repository, TypeORMError } from 'typeorm';

import { User } from '~/datastore/postgres/entities/user.entity';
import { PostgresUsersRepo } from '~/datastore/postgres/repos/users.repo';
import { MockPostgresUserRepository } from '~/test-utils/repo-mocks';
import { UsersRepo } from '~/users/repo/user.repo';

describe(`PostgresUsersRepo meets ${UsersRepo.type} requirements`, () => {
  const mockRepository = new MockPostgresUserRepository();
  const repo = new PostgresUsersRepo(mockRepository as unknown as Repository<User>);
  let _id = 1;

  mockRepository.create.mockImplementation(params => params);
  mockRepository.findOneBy.mockResolvedValue(null);

  const uniqueViolation = new TypeORMError('duplicate key value violates unique constraint');

  mockRepository.save.mockImplementation(async user => {
    const { name } = user;
    user.id = _id++;
    when(mockRepository.save)
      .calledWith(expect.objectContaining({ name }))
      .mockRejectedValue(uniqueViolation);
    when(mockRepository.findOneBy).calledWith({ name }).mockResolvedValue({ user });
  });

  UsersRepo.test(repo);
});
