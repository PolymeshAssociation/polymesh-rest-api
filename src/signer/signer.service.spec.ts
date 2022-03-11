/* eslint-disable import/first */
const mockIsPolymeshError = jest.fn();
const mockIsPolymeshTransaction = jest.fn();

import { Test, TestingModule } from '@nestjs/testing';
import { LocalSigningManager } from '@polymathnetwork/local-signing-manager';

import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { SignerModule } from '~/signer/signer.module';
import { SignerService } from '~/signer/signer.service';
import { MockPolymesh } from '~/test-utils/mocks';

jest.mock('@polymathnetwork/polymesh-sdk/utils', () => ({
  ...jest.requireActual('@polymathnetwork/polymesh-sdk/utils'),
  isPolymeshError: mockIsPolymeshError,
  isPolymeshTransaction: mockIsPolymeshTransaction,
}));

describe('SignerService', () => {
  let service: SignerService;
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

    const manager = await LocalSigningManager.create({ accounts: [] });
    manager.setSs58Format(0);
    service = new SignerService(manager, polymeshService);

    polymeshService = module.get<PolymeshService>(PolymeshService);
  });

  afterAll(() => {
    mockIsPolymeshError.mockReset();
    mockIsPolymeshTransaction.mockReset();
  });

  afterEach(async () => {
    await polymeshService.close();
  });

  describe('loadAccounts', () => {
    it('should call polymeshApi setSigningManager method', () => {
      service.loadAccounts({});
      expect(mockPolymeshApi.setSigningManager).toHaveBeenCalled();
    });

    it('should call setAddressByHandle for each account', async () => {
      const spy = jest.spyOn(service, 'setAddressByHandle');
      await service.loadAccounts({ Alice: '//Alice', Bob: '//Bob' });
      expect(spy).toHaveBeenCalledWith('Alice', '15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5');
      expect(spy).toHaveBeenCalledWith('Bob', '14E5nqKAp3oAJcmzgZhUD2RcptBeUBScxKHgJKU4HPNcKVf3');
      spy.mockRestore();
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
