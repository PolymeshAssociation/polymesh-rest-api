import { Test, TestingModule } from '@nestjs/testing';

import { AuthController } from '~/auth/auth.controller';
import { MockAuthService, mockAuthServiceProvider } from '~/test-utils/service-mocks';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: MockAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [mockAuthServiceProvider],
      controllers: [AuthController],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    mockAuthService = mockAuthServiceProvider.useValue;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createApiKey', () => {
    it('should call the service and return the result', async () => {
      const fakeResult = 'fake-result';
      const userId = 'someUserId';
      mockAuthService.createApiKey.mockResolvedValue(fakeResult);

      const result = await controller.createApiKey({ userId });

      expect(result).toEqual(fakeResult);
      expect(mockAuthService.createApiKey).toHaveBeenCalledWith({ userId });
    });
  });

  describe('deleteApiKey', () => {
    it('should call the service and return the result', async () => {
      const apiKey = 'someKey';

      const result = await controller.deleteApiKey({ apiKey });

      expect(result).toEqual({ message: 'key deleted' });
      expect(mockAuthService.deleteApiKey).toHaveBeenCalledWith({ apiKey });
    });
  });
});
