import { Test, TestingModule } from '@nestjs/testing';

import { ApiKeyStrategy } from '~/auth/strategies/api-key.strategy';
import { OpenStrategy } from '~/auth/strategies/open.strategy';
import { AuthMiddleware } from '~/middleware/auth.middleware';
import { makeMockConfigProvider, mockAuthServiceProvider } from '~/test-utils/service-mocks';

describe('AuthMiddleware', () => {
  let middleware: AuthMiddleware;
  let apiKeyStrategy: ApiKeyStrategy;
  let openStrategy: OpenStrategy;

  beforeEach(async () => {
    const mockConfigValues = {
      AUTH_STRATEGY: 'apiKey,open',
    } as Record<string, string>;

    const mockConfigProvider = makeMockConfigProvider(mockConfigValues);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        mockConfigProvider,
        mockAuthServiceProvider,
        ApiKeyStrategy,
        OpenStrategy,
        AuthMiddleware,
      ],
    }).compile();

    middleware = module.get<AuthMiddleware>(AuthMiddleware);

    apiKeyStrategy = module.get<ApiKeyStrategy>(ApiKeyStrategy);
    openStrategy = module.get<OpenStrategy>(OpenStrategy);
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should call configured strategies', () => {
    const apiSpy = jest.spyOn(apiKeyStrategy, 'authenticate');
    const openSpy = jest.spyOn(openStrategy, 'authenticate');
    const nextMock = jest.fn();

    middleware.use({}, {}, nextMock);

    expect(apiSpy).toHaveBeenCalled();
    expect(openSpy).toHaveBeenCalled();
    expect(nextMock).toHaveBeenCalled();
    apiSpy.mockRestore();
    openSpy.mockRestore();
  });

  it('should throw an UnauthorizedException if no user is found', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exposedMiddleware = middleware as any;
    exposedMiddleware.strategies = ['apiKey'];

    const nextMock = jest.fn();

    expect(() => middleware.use({}, {}, nextMock)).toThrowErrorMatchingSnapshot();
    expect(nextMock).not.toHaveBeenCalled();
  });
});
