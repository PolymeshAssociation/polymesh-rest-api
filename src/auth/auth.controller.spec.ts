import { Test, TestingModule } from '@nestjs/testing';

import { AuthController } from '~/auth/auth.controller';
import { testValues } from '~/test-utils/consts';
import { MockAuthService, mockAuthServiceProvider } from '~/test-utils/service-mocks';

const { user } = testValues;

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
      const userName = user.name;
      mockAuthService.createApiKey.mockResolvedValue(fakeResult);

      const result = await controller.createApiKey({ userName });

      expect(result).toEqual(fakeResult);
      expect(mockAuthService.createApiKey).toHaveBeenCalledWith({ userName });
    });
  });

  describe('deleteApiKey', () => {
    it('should call the service and return the result', async () => {
      const apiKey = 'someKey';

      const result = await controller.deleteApiKey({ apiKey });

      expect(result).toBeUndefined();
      expect(mockAuthService.deleteApiKey).toHaveBeenCalledWith({ apiKey });
    });
  });
});
