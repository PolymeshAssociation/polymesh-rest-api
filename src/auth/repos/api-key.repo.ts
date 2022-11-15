import { ApiKeyModel } from '~/auth/models/api-key.model';
import { testApiKeyRepo } from '~/auth/repos/api-key.repo.suite';
import { UserModel } from '~/users/model/user.model';

export abstract class ApiKeyRepo {
  public static type = 'ApiKey';

  public abstract getUserByApiKey(apiKey: string): Promise<UserModel>;
  public abstract createApiKey(user: UserModel): Promise<ApiKeyModel>;
  public abstract deleteApiKey(apiKey: string): Promise<void>;

  /**
   * a set of tests that implementers should pass
   */
  public static async test(repo: ApiKeyRepo): Promise<void> {
    return testApiKeyRepo(repo);
  }
}
