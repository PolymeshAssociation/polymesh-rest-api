import { Test, TestingModule } from '@nestjs/testing';
import { LocalSigningManager } from '@polymathnetwork/local-signing-manager';
import { SigningManager } from '@polymathnetwork/signing-manager-types';

import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { SignerModule } from '~/signer/signer.module';
import { SignerService } from '~/signer/signer.service';
import * as signerUtils from '~/signer/util';
import { MockHashicorpVaultSigningManager, MockPolymesh } from '~/test-utils/mocks';

describe('SignerService', () => {
  let service: SignerService;
  let manager: SigningManager;
  let polymeshService: PolymeshService;
  let mockPolymeshApi: MockPolymesh;

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymesh();
    const module: TestingModule = await Test.createTestingModule({
      imports: [PolymeshModule, SignerModule],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .compile();

    manager = await LocalSigningManager.create({ accounts: [] });
    manager.setSs58Format(0);
    service = new SignerService(manager, polymeshService);

    polymeshService = module.get<PolymeshService>(PolymeshService);
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
      let isLocalSpy: jest.SpyInstance;
      let isVaultSpy: jest.SpyInstance;

      beforeEach(() => {
        isLocalSpy = jest.spyOn(signerUtils, 'isLocalSigningManager').mockReturnValue(false);
        isVaultSpy = jest.spyOn(signerUtils, 'isVaultSigningManager').mockReturnValue(true);
      });

      afterEach(() => {
        isLocalSpy.mockRestore();
        isVaultSpy.mockRestore();
      });

      it('should call setAddressByHandle for each account', async () => {
        const vaultManager = new MockHashicorpVaultSigningManager();
        service = new SignerService(vaultManager, polymeshService);
        const addressSpy = jest.spyOn(service, 'setAddressByHandle');
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
        expect(addressSpy).toHaveBeenCalledWith('alice-1', 'ABC');
        expect(addressSpy).toHaveBeenCalledWith('bob-1', 'DEF');
        expect(addressSpy).toHaveBeenCalledWith('bob-2', 'GHI');
        addressSpy.mockRestore();
      });
    });
  });

  describe('getAddressByHandle', () => {
    it('should get a loaded Account', () => {
      service.setAddressByHandle('humanId', 'someAddress');
      const result = service.getAddressByHandle('humanId');
      expect(result).toEqual('someAddress');
    });

    it('should throw if an Account is not loaded', () => {
      expect(() => service.getAddressByHandle('badId')).toThrowError(
        'There is no signer associated to "badId"'
      );
    });
  });
});
