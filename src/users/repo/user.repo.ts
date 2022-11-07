import { CreateUserDto } from '~/users/dto/create-user.dto';
import { UserModel } from '~/users/model/user.model';
import { testUsersRepo } from '~/users/repo/user.repo.suite';

export abstract class UsersRepo {
  public static type = 'User';

  public abstract findByName(name: string): Promise<UserModel>;
  public abstract createUser(params: CreateUserDto): Promise<UserModel>;

  /**
   * a set of tests implementers should pass
   */
  public static async test(repo: UsersRepo): Promise<void> {
    return testUsersRepo(repo);
  }
}
