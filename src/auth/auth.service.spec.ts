import { Test, TestingModule } from '@nestjs/testing';

import { AuthService } from '~/auth/auth.service';
import { makeMockConfigProvider } from '~/test-utils/service-mocks';

describe('AuthService', () => {
  let service: AuthService;
  const apiKey = 'abc';

  beforeEach(async () => {
    const mockConfig = {
      API_KEYS: apiKey,
    };
    const mockConfigProvider = makeMockConfigProvider(mockConfig);

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, mockConfigProvider],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createApiKey', () => {
    it('should create an API key', async () => {
      const givenId = 'new-user';
      const { userId, secret } = await service.createApiKey({ userId: givenId });
      expect(userId).toEqual(givenId);
      expect(secret.length).toBeGreaterThan(12);
    });
  });

  describe('removeApiKey', () => {
    it('should remove an API key', async () => {
      let result = service.validateApiKey(apiKey);
      expect(result).toBeDefined();

      await service.deleteApiKey({ apiKey });

      result = service.validateApiKey(apiKey);
      expect(result).toBeUndefined();
    });
  });

  describe('validateApiKey', () => {
    it('should return the user when given a valid api key', () => {
      const result = service.validateApiKey(apiKey);
      expect(result).toMatchObject(expect.objectContaining({ id: 'configured-user' }));
    });

    it('should return undefined when the api key is not found', () => {
      const result = service.validateApiKey('not-a-key');
      expect(result).toBeUndefined();
    });
  });
});
