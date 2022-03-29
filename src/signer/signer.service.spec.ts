import { Test, TestingModule } from '@nestjs/testing';
import { HashicorpVaultSigningManager } from '@polymathnetwork/hashicorp-vault-signing-manager';
import { LocalSigningManager } from '@polymathnetwork/local-signing-manager';
import { SigningManager } from '@polymathnetwork/signing-manager-types';

import { LoggerModule } from '~/logger/logger.module';
import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { SignerModule } from '~/signer/signer.module';
import { SignerService } from '~/signer/signer.service';
import { MockHashicorpVaultSigningManager, MockPolymesh } from '~/test-utils/mocks';

describe('SignerService', () => {
  let service: SignerService;
  let manager: SigningManager;
  let logger: PolymeshLogger;
  let polymeshService: PolymeshService;
  let mockPolymeshApi: MockPolymesh;

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymesh();
    const module: TestingModule = await Test.createTestingModule({
      imports: [PolymeshModule, SignerModule, LoggerModule],
      providers: [mockPolymeshLoggerProvider],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .compile();

    logger = await module.resolve<PolymeshLogger>(PolymeshLogger);
    polymeshService = module.get<PolymeshService>(PolymeshService);
    manager = await LocalSigningManager.create({ accounts: [] });
    manager.setSs58Format(0);

    service = new SignerService(manager, polymeshService, logger);
  });

  afterEach(async () => {
    await polymeshService.close();
  });

  describe('loadAccounts', () => {
    it('should call polymeshApi setSigningManager method', () => {
      service.loadAccounts();
      expect(mockPolymeshApi.setSigningManager).toHaveBeenCalled();
    });

    describe('with LocalSigningManager', () => {
      it('should call setAddressByHandle for each account', async () => {
        const spy = jest.spyOn(service, 'setAddressByHandle');
        await service.loadAccounts({ Alice: '//Alice', Bob: '//Bob' });
        expect(spy).toHaveBeenCalledWith(
          'Alice',
          '15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5'
        );
        expect(spy).toHaveBeenCalledWith('Bob', '14E5nqKAp3oAJcmzgZhUD2RcptBeUBScxKHgJKU4HPNcKVf3');
        spy.mockRestore();
      });
    });

    describe('with HashicorpVaultSigningManager', () => {
      it('should call logKey for each account', async () => {
        const vaultManager = new MockHashicorpVaultSigningManager();
        Object.setPrototypeOf(vaultManager, HashicorpVaultSigningManager.prototype);
        service = new SignerService(vaultManager, polymeshService, logger);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const logKeySpy = jest.spyOn(service as any, 'logKey'); // spy on  private method
        vaultManager.getVaultKeys.mockResolvedValue([
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
        await service.loadAccounts();
        expect(logKeySpy).toHaveBeenCalledWith('alice-1', 'ABC');
        expect(logKeySpy).toHaveBeenCalledWith('bob-1', 'DEF');
        expect(logKeySpy).toHaveBeenCalledWith('bob-2', 'GHI');
        logKeySpy.mockRestore();
      });
    });
  });

  describe('getAddressByHandle', () => {
    describe('with LocalSigningManager', () => {
      it('should get a loaded Account from the address book', () => {
        service.setAddressByHandle('humanId', 'someAddress');
        return expect(service.getAddressByHandle('humanId')).resolves.toEqual('someAddress');
      });
      it('should throw if an Account is not loaded', () => {
        return expect(() => service.getAddressByHandle('badId')).rejects.toThrowError(
          'There is no signer associated to "badId"'
        );
      });
    });

    describe('with HashicorpVaultSigningManager', () => {
      const address = 'newAddress';
      beforeEach(() => {
        const vaultManager = new MockHashicorpVaultSigningManager();
        Object.setPrototypeOf(vaultManager, HashicorpVaultSigningManager.prototype);
        vaultManager.getVaultKeys.mockResolvedValue([
          { key: '0x123', address, name: 'new', version: 1 },
        ]);

        service = new SignerService(vaultManager, polymeshService, logger);
      });
      it('should check for the key in vault', () => {
        return expect(service.getAddressByHandle('new-1')).resolves.toEqual(address);
      });

      it('should throw if an Account is not found', () => {
        return expect(service.getAddressByHandle('badId')).rejects.toThrowError(
          'There is no signer associated to "badId'
        );
      });
    });
  });
});
