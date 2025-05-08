import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { LocalSigningManager } from '@polymeshassociation/local-signing-manager';
import { PolkadotSigner } from '@polymeshassociation/signing-manager-types';
import { when } from 'jest-when';

import { AppConflictError, AppNotFoundError } from '~/common/errors';
import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { LocalSigningService } from '~/signing/services/local-signing.service';
import { SigningModule } from '~/signing/signing.module';
import { testValues } from '~/test-utils/consts';
import { MockPolymesh } from '~/test-utils/mocks';

const {
  offlineTx: {
    payload: { payload },
  },
} = testValues;
describe('LocalSigningService', () => {
  let service: LocalSigningService;
  let logger: PolymeshLogger;
  let polymeshService: PolymeshService;
  let mockPolymeshApi: MockPolymesh;
  let mockExternalSigner: DeepMocked<PolkadotSigner>;

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymesh();
    const module: TestingModule = await Test.createTestingModule({
      imports: [PolymeshModule, SigningModule],
      providers: [mockPolymeshLoggerProvider],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .compile();

    logger = mockPolymeshLoggerProvider.useValue as unknown as PolymeshLogger;
    polymeshService = module.get<PolymeshService>(PolymeshService);
    const manager = await LocalSigningManager.create({ accounts: [] });
    manager.setSs58Format(0);
    mockExternalSigner = createMock<PolkadotSigner>();
    jest.spyOn(manager, 'getExternalSigner').mockReturnValue(mockExternalSigner);

    service = new LocalSigningService(manager, polymeshService, logger);
  });

  afterEach(async () => {
    await polymeshService.close();
  });

  describe('initialize', () => {
    it('should call polymeshApi setSigningManager method', async () => {
      await service.initialize();
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
      expect(() => service.getAddressByHandle('badId')).toThrow(AppNotFoundError);
    });
  });

  describe('isAddress', () => {
    it('should return the SDK result', () => {
      mockPolymeshApi.accountManagement.isValidAddress.mockReturnValue(true);

      const result = service.isAddress('fakeAddress');

      expect(result).toEqual(true);
    });
  });

  describe('signPayload', () => {
    it('should sign the payload', async () => {
      const signature = '0x01';
      const mockResponse = {
        id: 1,
        signature,
      } as const;

      when(mockExternalSigner.signPayload).calledWith(payload).mockResolvedValue(mockResponse);

      const result = await service.signPayload(payload);

      expect(result).toEqual(signature);
    });
  });

  describe('addSigner', () => {
    it('should add a new signer and return its address', async () => {
      const handle = 'newSigner';
      const mnemonic = '//Alice';
      const expectedAddress = '15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5';

      const result = await service.addSigner(handle, mnemonic);

      expect(result).toBe(expectedAddress);
    });

    it('should throw AppConflictError when adding a signer with existing handle', async () => {
      const handle = 'existingSigner';
      const mnemonic = '//Alice';

      await service.addSigner(handle, mnemonic);

      await expect(service.addSigner(handle, mnemonic)).rejects.toThrow(AppConflictError);
    });
  });
});
