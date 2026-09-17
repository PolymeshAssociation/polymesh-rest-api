import { Test, TestingModule } from '@nestjs/testing';
import { when } from 'jest-when';

import { SignerModel } from '~/signing/models/signer.model';
import { SignerManagementController } from '~/signing/signer-management.controller';
import { mockSigningProvider } from '~/signing/signing.mock';
import { testValues } from '~/test-utils/consts';

describe('SignerManagementController', () => {
  const signingService = mockSigningProvider.useValue;
  const {
    testAccount: { address },
  } = testValues;
  let controller: SignerManagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SignerManagementController],
      providers: [mockSigningProvider],
    }).compile();
    controller = module.get<SignerManagementController>(SignerManagementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('addSigner', () => {
    it('should call the service and return the result', () => {
      const handle = 'test-handle';
      const mnemonic = 'test mnemonic phrase';
      const expectedResult = new SignerModel({ address });

      when(signingService.addSigner).calledWith(handle, mnemonic).mockResolvedValue(address);
      return expect(controller.addSigner({ handle, mnemonic })).resolves.toEqual(expectedResult);
    });
  });
});
