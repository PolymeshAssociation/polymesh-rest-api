import { ApiKeyRepo } from '~/auth/repos/api-key.repo';
import { AppNotFoundError } from '~/common/errors';
import { testValues } from '~/test-utils/consts';

const { user } = testValues;

export const testApiKeyRepo = async (repo: ApiKeyRepo): Promise<void> => {
  let secret: string;
  let userId: string;

  const expectedNotFoundError = new AppNotFoundError('*REDACTED*', ApiKeyRepo.type);

  describe('method: createApiKey', () => {
    it('should create an API key', async () => {
      ({ secret, userId } = await repo.createApiKey(user));
      expect(userId).toEqual(user.id);
      expect(secret).toBeDefined();
    });
  });

  describe('method: getByApiKey', () => {
    it('should return the User associated to the API key', async () => {
      const foundUser = await repo.getUserByApiKey(secret);
      expect(foundUser).toEqual(user);
    });

    it('should throw NotFoundError if the API key does not exist', () => {
      const unknownApiKey = 'unknownApiKey';
      return expect(repo.getUserByApiKey(unknownApiKey)).rejects.toThrow(expectedNotFoundError);
    });
  });

  describe('method: deleteApiKey', () => {
    it('should remove the API key', async () => {
      await repo.deleteApiKey(secret);

      expect(repo.getUserByApiKey(secret)).rejects.toThrow(expectedNotFoundError);
    });

    it('should be a no-op on if the API key is not found', () => {
      expect(repo.deleteApiKey(secret)).resolves.not.toThrow();
    });
  });
};
