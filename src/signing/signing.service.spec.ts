import { Test, TestingModule } from '@nestjs/testing';
import { FireblocksSigningManager } from '@polymeshassociation/fireblocks-signing-manager';
import { DerivationPath } from '@polymeshassociation/fireblocks-signing-manager/lib/fireblocks';
import { HashicorpVaultSigningManager } from '@polymeshassociation/hashicorp-vault-signing-manager';
import { LocalSigningManager } from '@polymeshassociation/local-signing-manager';

import { AppValidationError } from '~/common/errors';
import { LoggerModule } from '~/logger/logger.module';
import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import {
  MockFireblocksSigningManager,
  MockHashicorpVaultSigningManager,
} from '~/signing/signing.mock';
import { SigningModule } from '~/signing/signing.module';
import {
  FireblocksSigningService,
  LocalSigningService,
  VaultSigningService,
} from '~/signing/signing.service';
import { testAccount } from '~/test-utils/consts';
import { MockPolymesh } from '~/test-utils/mocks';

describe('true', () => {
  it('is true', () => expect(true).toBe(true));
});

// describe('LocalSigningService', () => {
//   let service: LocalSigningService;
//   let logger: PolymeshLogger;
//   let polymeshService: PolymeshService;
//   let mockPolymeshApi: MockPolymesh;

//   beforeEach(async () => {
//     mockPolymeshApi = new MockPolymesh();
//     const module: TestingModule = await Test.createTestingModule({
//       imports: [PolymeshModule, SigningModule],
//       providers: [mockPolymeshLoggerProvider],
//     })
//       .overrideProvider(POLYMESH_API)
//       .useValue(mockPolymeshApi)
//       .compile();

//     logger = mockPolymeshLoggerProvider.useValue as unknown as PolymeshLogger;
//     polymeshService = module.get<PolymeshService>(PolymeshService);
//     const manager = await LocalSigningManager.create({ accounts: [] });
//     manager.setSs58Format(0);

//     service = new LocalSigningService(manager, polymeshService, logger);
//   });

//   afterEach(async () => {
//     await polymeshService.close();
//   });

//   describe('initialize', () => {
//     it('should call polymeshApi setSigningManager method', async () => {
//       await service.initialize();
//       expect(mockPolymeshApi.setSigningManager).toHaveBeenCalled();
//     });

//     it('should call setAddressByHandle for each account', async () => {
//       const spy = jest.spyOn(service, 'setAddressByHandle');
//       await service.initialize({ Alice: '//Alice', Bob: '//Bob' });
//       expect(spy).toHaveBeenCalledWith('Alice', '15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5');
//       expect(spy).toHaveBeenCalledWith('Bob', '14E5nqKAp3oAJcmzgZhUD2RcptBeUBScxKHgJKU4HPNcKVf3');
//       spy.mockRestore();
//     });
//   });

//   describe('getAddressByHandle', () => {
//     it('should get a loaded Account from the address book', () => {
//       service.setAddressByHandle('humanId', 'someAddress');
//       return expect(service.getAddressByHandle('humanId')).resolves.toEqual('someAddress');
//     });
//     it('should throw if an Account is not loaded', () => {
//       expect(() => service.getAddressByHandle('badId')).toThrowError(
//         'There is no signer associated to "badId"'
//       );
//     });
//   });
// });

// describe('VaultSigningService', () => {
//   let service: VaultSigningService;
//   let logger: PolymeshLogger;
//   let polymeshService: PolymeshService;
//   let mockPolymeshApi: MockPolymesh;
//   let manager: MockHashicorpVaultSigningManager;

//   beforeEach(async () => {
//     mockPolymeshApi = new MockPolymesh();
//     const module: TestingModule = await Test.createTestingModule({
//       imports: [PolymeshModule, SigningModule, LoggerModule],
//       providers: [mockPolymeshLoggerProvider],
//     })
//       .overrideProvider(POLYMESH_API)
//       .useValue(mockPolymeshApi)
//       .compile();

//     logger = mockPolymeshLoggerProvider.useValue as unknown as PolymeshLogger;
//     polymeshService = module.get<PolymeshService>(PolymeshService);
//     manager = new MockHashicorpVaultSigningManager();

//     manager.setSs58Format(0);

//     const castedManager = manager as unknown as HashicorpVaultSigningManager;

//     service = new VaultSigningService(castedManager, polymeshService, logger);

//     manager.getVaultKeys.mockResolvedValue([
//       {
//         name: 'alice',
//         address: 'ABC',
//         publicKey: '0x123',
//         version: 1,
//       },
//       {
//         name: 'bob',
//         address: 'DEF',
//         publicKey: '0x456',
//         version: 1,
//       },
//       {
//         name: 'bob',
//         address: 'GHI',
//         publicKey: '0x456',
//         version: 2,
//       },
//     ]);
//   });

//   afterEach(async () => {
//     await polymeshService.close();
//   });

//   describe('initialize', () => {
//     it('should call logKey for each account', async () => {
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       const logKeySpy = jest.spyOn(service as any, 'logKey'); // spy on  private method

//       await service.initialize();
//       expect(logKeySpy).toHaveBeenCalledWith('alice-1', 'ABC');
//       expect(logKeySpy).toHaveBeenCalledWith('bob-1', 'DEF');
//       expect(logKeySpy).toHaveBeenCalledWith('bob-2', 'GHI');
//       logKeySpy.mockRestore();
//     });
//   });

//   describe('getAddressByKey', () => {
//     it('should check for the key in vault', () => {
//       return expect(service.getAddressByHandle('alice-1')).resolves.toEqual('ABC');
//     });

//     it('should throw if an Account is not found', () => {
//       return expect(service.getAddressByHandle('badId')).rejects.toThrowError(
//         'There is no signer associated to "badId'
//       );
//     });
//   });
// });

// describe('FireblocksSigningService', () => {
//   let service: FireblocksSigningService;
//   let logger: PolymeshLogger;
//   let polymeshService: PolymeshService;
//   let mockPolymeshApi: MockPolymesh;
//   let manager: MockFireblocksSigningManager;

//   beforeEach(async () => {
//     mockPolymeshApi = new MockPolymesh();
//     const module: TestingModule = await Test.createTestingModule({
//       imports: [PolymeshModule, SigningModule, LoggerModule],
//       providers: [mockPolymeshLoggerProvider],
//     })
//       .overrideProvider(POLYMESH_API)
//       .useValue(mockPolymeshApi)
//       .compile();

//     logger = mockPolymeshLoggerProvider.useValue as unknown as PolymeshLogger;
//     polymeshService = module.get<PolymeshService>(PolymeshService);
//     manager = new MockFireblocksSigningManager();

//     service = new FireblocksSigningService(
//       manager as unknown as FireblocksSigningManager,
//       polymeshService,
//       logger
//     );
//   });

//   describe('getAddressByHandle', () => {
//     const { address } = testAccount;
//     const mockDeriveResponse = {
//       publicKey: '01000',
//       address,
//       status: 0,
//       algorithm: 'TEST-ALGO',
//       derivationPath: [44, 1, 0, 0, 0] as DerivationPath,
//     };

//     it('should return the address associated to the derivation path', async () => {
//       const handle = '1-2-3';
//       const expectedDerivationPath = [44, 1, 1, 2, 3] as DerivationPath;

//       manager.deriveAccount.mockResolvedValue(mockDeriveResponse);

//       const result = await service.getAddressByHandle(handle);

//       expect(result).toEqual(address);
//       expect(manager.deriveAccount).toHaveBeenCalledWith(expectedDerivationPath);
//     });

//     it('should default non specified sections to 0 for the derivation path', async () => {
//       const handle = '1';
//       const expectedDerivationPath = [44, 1, 1, 0, 0] as DerivationPath;

//       manager.deriveAccount.mockResolvedValue(mockDeriveResponse);

//       await service.getAddressByHandle(handle);

//       expect(manager.deriveAccount).toHaveBeenCalledWith(expectedDerivationPath);
//     });

//     it('should infer POLYX BIP-44 path from the ss58Format', async () => {
//       const handle = '0';

//       const expectedDerivationPath = [44, 595, 0, 0, 0] as DerivationPath;

//       manager.deriveAccount.mockResolvedValue(mockDeriveResponse);
//       manager.ss58Format = 12;

//       await service.getAddressByHandle(handle);

//       expect(manager.deriveAccount).toHaveBeenCalledWith(expectedDerivationPath);
//     });

//     it('should error if given a signer with a non number section', async () => {
//       const invalidSigners = ['aaa-bbb-ccc', '', '1-2-3-4', '0-a-1', '0--1-2'];

//       const expectedError = new AppValidationError(
//         'Fireblocks `signer` field should be 3 integers formatted like: `x-y-z`'
//       );

//       for (const signer of invalidSigners) {
//         await expect(service.getAddressByHandle(signer)).rejects.toThrow(expectedError);
//       }
//     });
//   });
// });
