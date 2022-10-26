import { ApiKeyRepo } from '~/auth/repos/api-key.repo';
import { AppNotFoundError } from '~/common/errors';
import { testUser } from '~/test-utils/consts';

export const testApiKeyRepo = async (repo: ApiKeyRepo): Promise<void> => {
  let secret: string;
  let userId: string;

  const expectedNotFoundError = new AppNotFoundError('*REDACTED*', ApiKeyRepo.type);

  describe('method: createApiKey', () => {
    it('should create an API key', async () => {
      ({ secret, userId } = await repo.createApiKey(testUser));
      expect(userId).toEqual(testUser.id);
      expect(secret).toBeDefined();
    });
  });

  describe('method: getByApiKey', () => {
    it('should return the User associated to the API key', async () => {
      const foundUser = await repo.getUserByApiKey(secret);
      expect(foundUser).toEqual(testUser);
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
