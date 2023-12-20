import { LocalUserRepo } from '~/datastore/local-store/repos/users.repo';
import { UsersRepo } from '~/users/repo/user.repo';

describe(`LocalUserRepo ${UsersRepo.type} test suite`, () => {
  const repo = new LocalUserRepo();

  UsersRepo.test(repo);
});
