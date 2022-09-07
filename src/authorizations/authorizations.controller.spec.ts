import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { AuthorizationsController } from '~/authorizations/authorizations.controller';
import { AuthorizationsService } from '~/authorizations/authorizations.service';
import { MockAuthorizationsService } from '~/test-utils/service-mocks';

describe('AuthorizationsController', () => {
  let controller: AuthorizationsController;

  const mockAuthorizationsService = new MockAuthorizationsService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthorizationsController],
      providers: [AuthorizationsService],
    })
      .overrideProvider(AuthorizationsService)
      .useValue(mockAuthorizationsService)
      .compile();

    controller = module.get<AuthorizationsController>(AuthorizationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('accept', () => {
    it('should call the service and return the transaction details', async () => {
      const transactions = ['transaction'];

      mockAuthorizationsService.accept.mockResolvedValue({ transactions });

      const authId = new BigNumber(1);
      const signer = '0x6000';
      const result = await controller.accept({ id: authId }, { signer });

      expect(result).toEqual({
        result: undefined,
        transactions: ['transaction'],
      });
      expect(mockAuthorizationsService.accept).toHaveBeenCalledWith(authId, signer, undefined);
    });
  });

  describe('remove', () => {
    it('should call the service and return the transaction details', async () => {
      const transactions = ['transaction'];

      mockAuthorizationsService.remove.mockResolvedValue({ transactions });

      const authId = new BigNumber(1);
      const signer = '0x6000';
      const result = await controller.remove({ id: authId }, { signer });

      expect(result).toEqual({
        result: undefined,
        transactions: ['transaction'],
      });
      expect(mockAuthorizationsService.remove).toHaveBeenCalledWith(authId, signer, undefined);
    });
  });
});
