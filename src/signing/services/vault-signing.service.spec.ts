import { Test, TestingModule } from '@nestjs/testing';
import { HashicorpVaultSigningManager } from '@polymeshassociation/hashicorp-vault-signing-manager';

import { LoggerModule } from '~/logger/logger.module';
import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { VaultSigningService } from '~/signing/services/vault-signing.service';
import { MockHashicorpVaultSigningManager } from '~/signing/signing.mock';
import { SigningModule } from '~/signing/signing.module';
import { MockPolymesh } from '~/test-utils/mocks';

describe('VaultSigningService', () => {
  let service: VaultSigningService;
  let logger: PolymeshLogger;
  let polymeshService: PolymeshService;
  let mockPolymeshApi: MockPolymesh;
  let manager: MockHashicorpVaultSigningManager;

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
    manager = new MockHashicorpVaultSigningManager();

    manager.setSs58Format(0);

    const castedManager = manager as unknown as HashicorpVaultSigningManager;

    service = new VaultSigningService(castedManager, polymeshService, logger);

    manager.getVaultKeys.mockResolvedValue([
      {
        name: 'alice',
        address: 'ABC',
        publicKey: '0x123',
        version: 1,
      },
      {
        name: 'bob',
        address: 'DEF',
        publicKey: '0x456',
        version: 1,
      },
      {
        name: 'bob',
        address: 'GHI',
        publicKey: '0x456',
        version: 2,
      },
    ]);
  });

  afterEach(async () => {
    await polymeshService.close();
  });

  describe('initialize', () => {
    it('should call logKey for each account', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const logKeySpy = jest.spyOn(service as any, 'logKey'); // spy on  private method

      await service.initialize();
      expect(logKeySpy).toHaveBeenCalledWith('alice-1', 'ABC');
      expect(logKeySpy).toHaveBeenCalledWith('bob-1', 'DEF');
      expect(logKeySpy).toHaveBeenCalledWith('bob-2', 'GHI');
      logKeySpy.mockRestore();
    });
  });

  describe('getAddressByKey', () => {
    it('should check for the key in vault', () => {
      return expect(service.getAddressByHandle('alice-1')).resolves.toEqual('ABC');
    });

    it('should throw if an Account is not found', () => {
      return expect(service.getAddressByHandle('badId')).rejects.toThrowError(
        'There is no signer associated to "badId'
      );
    });
  });
});
