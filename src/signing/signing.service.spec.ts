import { Test, TestingModule } from '@nestjs/testing';
import { HashicorpVaultSigningManager } from '@polymathnetwork/hashicorp-vault-signing-manager';
import { LocalSigningManager } from '@polymathnetwork/local-signing-manager';

import { LoggerModule } from '~/logger/logger.module';
import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { MockHashicorpVaultSigningManager } from '~/signing/signing.mock';
import { SigningModule } from '~/signing/signing.module';
import { LocalSigningService, VaultSigningService } from '~/signing/signing.service';
import { MockPolymesh } from '~/test-utils/mocks';

describe('LocalSigningService', () => {
  let service: LocalSigningService;
  let logger: PolymeshLogger;
  let polymeshService: PolymeshService;
  let mockPolymeshApi: MockPolymesh;

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymesh();
    const module: TestingModule = await Test.createTestingModule({
      imports: [PolymeshModule, SigningModule, LoggerModule],
      providers: [mockPolymeshLoggerProvider],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .compile();

    logger = await module.resolve<PolymeshLogger>(PolymeshLogger);
    polymeshService = module.get<PolymeshService>(PolymeshService);
    const manager = await LocalSigningManager.create({ accounts: [] });
    manager.setSs58Format(0);

    service = new LocalSigningService(manager, polymeshService, logger);
  });

  afterEach(async () => {
    await polymeshService.close();
  });

  describe('initialize', () => {
    it('should call polymeshApi setSigningManager method', async () => {
      await service.initialize({});
      expect(mockPolymeshApi.setSigningManager).toHaveBeenCalled();
    });

    it('should call setAddressByHandle for each account', async () => {
      const spy = jest.spyOn(service, 'setAddressByHandle');
      await service.initialize({ Alice: '//Alice', Bob: '//Bob' });
      expect(spy).toHaveBeenCalledWith('Alice', '15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5');
      expect(spy).toHaveBeenCalledWith('Bob', '14E5nqKAp3oAJcmzgZhUD2RcptBeUBScxKHgJKU4HPNcKVf3');
      spy.mockRestore();
    });
  });

  describe('getAddressByHandle', () => {
    it('should get a loaded Account from the address book', () => {
      service.setAddressByHandle('humanId', 'someAddress');
      return expect(service.getAddressByHandle('humanId')).resolves.toEqual('someAddress');
    });
    it('should throw if an Account is not loaded', () => {
      expect(() => service.getAddressByHandle('badId')).toThrowError(
        'There is no signer associated to "badId"'
      );
    });
  });
});

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

    logger = await module.resolve<PolymeshLogger>(PolymeshLogger);
    polymeshService = module.get<PolymeshService>(PolymeshService);
    manager = new MockHashicorpVaultSigningManager();

    manager.setSs58Format(0);

    const castedManager = (manager as unknown) as HashicorpVaultSigningManager;

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
