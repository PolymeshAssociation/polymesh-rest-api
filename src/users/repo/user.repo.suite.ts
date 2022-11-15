import { AppConflictError, AppNotFoundError } from '~/common/errors';
import { UserModel } from '~/users/model/user.model';
import { UsersRepo } from '~/users/repo/user.repo';

const name = 'Alice';

export const testUsersRepo = async (usersRepo: UsersRepo): Promise<void> => {
  let user: UserModel;

  describe('method: createUser', () => {
    it('should create a user', async () => {
      user = await usersRepo.createUser({ name });
      expect(user).toMatchSnapshot();
    });

    it('should throw ExistsError if user exists with given name', () => {
      const expectedError = new AppConflictError(name, UsersRepo.type);

      return expect(usersRepo.createUser({ name })).rejects.toThrowError(expectedError);
    });
  });

  describe('method: findByName', () => {
    it('should find the created user', async () => {
      const foundUser = await usersRepo.findByName(name);
      expect(foundUser).toMatchSnapshot();
    });

    it('should throw NotFoundError if the user does not exist', async () => {
      const unknownName = 'unknownName';
      const expectedError = new AppNotFoundError(unknownName, UsersRepo.type);
      return expect(usersRepo.findByName(unknownName)).rejects.toThrowError(expectedError);
    });
  });
};
