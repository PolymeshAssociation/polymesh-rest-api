import { Test, TestingModule } from '@nestjs/testing';
import { when } from 'jest-when';

import { SignerModel } from '~/signing/models/signer.model';
import { SigningController } from '~/signing/signing.controller';
import { mockSigningProvider } from '~/signing/signing.mock';
import { testAccount } from '~/test-utils/consts';

describe('SigningController', () => {
  const signingService = mockSigningProvider.useValue;
  const { address } = testAccount;

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
      const signer = 'alice';
      when(signingService.getAddressByHandle).calledWith(signer).mockResolvedValue(address);

      const expectedResult = new SignerModel({ address });

      return expect(controller.getSignerAddress({ signer })).resolves.toEqual(expectedResult);
    });
  });
});
