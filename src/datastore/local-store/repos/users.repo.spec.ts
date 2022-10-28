import { LocalUserRepo } from '~/datastore/local-store/repos/users.repo';
import { UsersRepo } from '~/users/repo/user.repo';

describe(`LocalUserRepo does not meet ${UsersRepo.type} test suite requirements`, () => {
  const repo = new LocalUserRepo();

  UsersRepo.test(repo);
});
