import { Test, TestingModule } from '@nestjs/testing';
import { when } from 'jest-when';
import passport from 'passport';

import { ApiKeyStrategy } from '~/auth/strategies/api-key.strategy';
import { AuthStrategy } from '~/auth/strategies/strategies.consts';
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
    const mockRequest = {
      headers: {
        'x-api-key': mockApiKey,
      },
    };

    when(authService.validateApiKey).calledWith(mockApiKey).mockReturnValue(mockedUser);

    let authorizedUser;
    passport.authenticate(AuthStrategy.ApiKey, (request, user) => {
      authorizedUser = user;
    })(mockRequest, {}, {});

    expect(authorizedUser).toEqual(mockedUser);
  });

  it('should return an Unauthorized response if the key is not found', async () => {
    const mockRequest = {
      headers: {
        'x-api-key': 'not-a-secret',
      },
    };

    when(authService.validateApiKey).calledWith(mockApiKey).mockReturnValue(mockedUser);

    let authorizedUser;
    passport.authenticate(AuthStrategy.ApiKey, (request, user) => {
      authorizedUser = user;
    })(mockRequest, {}, {});

    expect(authorizedUser).toBeFalsy();
  });
});
