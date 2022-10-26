import { DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { when } from 'jest-when';

import { AuthService } from '~/auth/auth.service';
import { ApiKeyRepo } from '~/auth/repos/api-key.repo';
import { AppNotFoundError } from '~/common/errors';
import { testUser } from '~/test-utils/consts';
import { mockApiKeyRepoProvider, mockUserRepoProvider } from '~/test-utils/repo-mocks';
import { mockUserServiceProvider } from '~/test-utils/service-mocks';
import { UsersService } from '~/users/users.service';

describe('AuthService', () => {
  const testApiKey = 'authServiceSecret';
  const expectedNotFoundError = new AppNotFoundError('*REDACTED*', ApiKeyRepo.type);

  let service: AuthService;
  let mockUsersService: DeepMocked<UsersService>;
  let mockApiKeyRepo: DeepMocked<ApiKeyRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        mockUserServiceProvider,
        mockApiKeyRepoProvider,
        mockUserRepoProvider,
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    mockUsersService = mockUserServiceProvider.useValue as DeepMocked<UsersService>;
    mockApiKeyRepo = mockApiKeyRepoProvider.useValue as DeepMocked<ApiKeyRepo>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('method: createApiKey', () => {
    it('should create an API key', async () => {
      when(mockUsersService.getByName).calledWith(testUser.name).mockResolvedValue(testUser);
      when(mockApiKeyRepo.createApiKey)
        .calledWith(testUser)
        .mockResolvedValue({ userId: testUser.id, secret: testApiKey });

      const { userId, secret } = await service.createApiKey({ userName: testUser.name });

      expect(userId).toEqual(testUser.id);
      expect(secret.length).toBeGreaterThan(8);
    });
  });

  describe('method: validateApiKey', () => {
    it('should return the user when given a valid api key', async () => {
      when(mockApiKeyRepo.getUserByApiKey).calledWith(testApiKey).mockResolvedValue(testUser);

      const foundUser = await service.validateApiKey(testApiKey);
      expect(foundUser).toEqual(testUser);
    });

    it('should throw a NotFoundError when given an unknown API key', () => {
      mockApiKeyRepo.getUserByApiKey.mockRejectedValue(expectedNotFoundError);

      return expect(service.validateApiKey('unknown-secret')).rejects.toThrow(
        expectedNotFoundError
      );
    });
  });

  describe('method: deleteApiKey', () => {
    it('should delete an API key', async () => {
      mockApiKeyRepo.deleteApiKey.mockResolvedValue(undefined);

      await service.deleteApiKey({ apiKey: testApiKey });

      expect(mockApiKeyRepo.deleteApiKey).toBeCalledWith(testApiKey);
    });
  });
});
