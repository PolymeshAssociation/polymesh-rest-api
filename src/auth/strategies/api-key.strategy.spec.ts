import { Test, TestingModule } from '@nestjs/testing';
import { when } from 'jest-when';

import { ApiKeyStrategy } from '~/auth/strategies/api-key.strategy';
import { MockAuthService, mockAuthServiceProvider } from '~/test-utils/service-mocks';

describe('ApiKeyStrategy', () => {
  let strategy: ApiKeyStrategy;
  let authService: MockAuthService;
  const mockedUser = 'fake-user';
  const mockApiKey = 'someSecret';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [mockAuthServiceProvider, ApiKeyStrategy],
    }).compile();

    strategy = module.get<ApiKeyStrategy>(ApiKeyStrategy);
    authService = mockAuthServiceProvider.useValue;
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should verify with the user when given a valid api key', async () => {
    when(authService.validateApiKey).calledWith(mockApiKey).mockResolvedValue(mockedUser);

    const result = await strategy.validate(mockApiKey);
    expect(result).toEqual(mockedUser);
  });

  it('should return an Unauthorized response if the key is not found', async () => {
    when(authService.validateApiKey).calledWith('not-a-secret').mockResolvedValue(null);

    await expect(strategy.validate('not-a-secret')).rejects.toThrow('API key not found');
  });
});
