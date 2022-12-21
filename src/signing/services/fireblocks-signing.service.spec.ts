import { Test, TestingModule } from '@nestjs/testing';
import { FireblocksSigningManager } from '@polymeshassociation/fireblocks-signing-manager';
import { DerivationPath } from '@polymeshassociation/fireblocks-signing-manager/lib/fireblocks';

import { AppValidationError } from '~/common/errors';
import { LoggerModule } from '~/logger/logger.module';
import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { FireblocksSigningService } from '~/signing/services';
import { MockFireblocksSigningManager } from '~/signing/signing.mock';
import { SigningModule } from '~/signing/signing.module';
import { testAccount } from '~/test-utils/consts';
import { MockPolymesh } from '~/test-utils/mocks';

describe('FireblocksSigningService', () => {
  let service: FireblocksSigningService;
  let logger: PolymeshLogger;
  let polymeshService: PolymeshService;
  let mockPolymeshApi: MockPolymesh;
  let manager: MockFireblocksSigningManager;

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymesh();
    const module: TestingModule = await Test.createTestingModule({
      imports: [PolymeshModule, SigningModule, LoggerModule],
      providers: [mockPolymeshLoggerProvider],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .compile();

    logger = mockPolymeshLoggerProvider.useValue as unknown as PolymeshLogger;
    polymeshService = module.get<PolymeshService>(PolymeshService);
    manager = new MockFireblocksSigningManager();

    service = new FireblocksSigningService(
      manager as unknown as FireblocksSigningManager,
      polymeshService,
      logger
    );
  });

  afterEach(async () => {
    await polymeshService.close();
  });

  describe('getAddressByHandle', () => {
    const { address } = testAccount;
    const mockDeriveResponse = {
      publicKey: '01000',
      address,
      status: 0,
      algorithm: 'TEST-ALGO',
      derivationPath: [44, 1, 0, 0, 0] as DerivationPath,
    };

    it('should return the address associated to the derivation path', async () => {
      const handle = '1-2-3';
      const expectedDerivationPath = [44, 1, 1, 2, 3] as DerivationPath;

      manager.deriveAccount.mockResolvedValue(mockDeriveResponse);

      const result = await service.getAddressByHandle(handle);

      expect(result).toEqual(address);
      expect(manager.deriveAccount).toHaveBeenCalledWith(expectedDerivationPath);
    });

    it('should default non specified sections to 0 for the derivation path', async () => {
      const handle = '1';
      const expectedDerivationPath = [44, 1, 1, 0, 0] as DerivationPath;

      manager.deriveAccount.mockResolvedValue(mockDeriveResponse);

      await service.getAddressByHandle(handle);

      expect(manager.deriveAccount).toHaveBeenCalledWith(expectedDerivationPath);
    });

    it('should infer POLYX BIP-44 path from the ss58Format', async () => {
      const handle = '0';

      const expectedDerivationPath = [44, 595, 0, 0, 0] as DerivationPath;

      manager.deriveAccount.mockResolvedValue(mockDeriveResponse);
      manager.ss58Format = 12;

      await service.getAddressByHandle(handle);

      expect(manager.deriveAccount).toHaveBeenCalledWith(expectedDerivationPath);
    });

    it('should error if given an invalid signer', async () => {
      const invalidSigners = ['aaa-bbb-ccc', '', '1-2-3-4', '0-a-1', '0--1-2'];

      const expectedError = new AppValidationError(
        'Fireblocks `signer` field should be 3 integers formatted like: `x-y-z`'
      );

      for (const signer of invalidSigners) {
        await expect(service.getAddressByHandle(signer)).rejects.toThrow(expectedError);
      }
    });
  });
});
