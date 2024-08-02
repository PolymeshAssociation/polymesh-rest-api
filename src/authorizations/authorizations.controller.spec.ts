import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { AuthorizationsController } from '~/authorizations/authorizations.controller';
import { AuthorizationsService } from '~/authorizations/authorizations.service';
import { processedTxResult, testValues } from '~/test-utils/consts';
import { MockAuthorizationsService } from '~/test-utils/service-mocks';

describe('AuthorizationsController', () => {
  let controller: AuthorizationsController;
  const { signer, txResult } = testValues;
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
      mockAuthorizationsService.accept.mockResolvedValue(txResult);

      const authId = new BigNumber(1);
      const result = await controller.accept({ id: authId }, { signer });

      expect(result).toEqual(processedTxResult);
      expect(mockAuthorizationsService.accept).toHaveBeenCalledWith(authId, { signer });
    });
  });

  describe('remove', () => {
    it('should call the service and return the transaction details', async () => {
      mockAuthorizationsService.remove.mockResolvedValue(txResult);

      const authId = new BigNumber(1);
      const result = await controller.remove({ id: authId }, { signer });

      expect(result).toEqual(processedTxResult);
      expect(mockAuthorizationsService.remove).toHaveBeenCalledWith(authId, { signer });
    });
  });
});
