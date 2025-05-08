import { Test, TestingModule } from '@nestjs/testing';
import { when } from 'jest-when';

import { SignerModel } from '~/signing/models/signer.model';
import { SigningController } from '~/signing/signing.controller';
import { mockSigningProvider } from '~/signing/signing.mock';
import { testValues } from '~/test-utils/consts';

describe('SigningController', () => {
  const signingService = mockSigningProvider.useValue;
  const {
    testAccount: { address },
    signer,
  } = testValues;
  let controller: SigningController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SigningController],
      providers: [mockSigningProvider],
    }).compile();
    controller = module.get<SigningController>(SigningController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSignerInfo', () => {
    it('should call the service and return the result', () => {
      const expectedResult = new SignerModel({ address });
      when(signingService.getAddressByHandle).calledWith(signer).mockResolvedValue(address);
      return expect(controller.getSignerAddress({ signer })).resolves.toEqual(expectedResult);
    });
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
