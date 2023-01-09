import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { cryptoWaitReady } from '@polymeshassociation/polymesh-sdk/utils';
import { when } from 'jest-when';

import { AccountsService } from '~/accounts/accounts.service';
import { AppInternalError } from '~/common/errors';
import { DeveloperTestingService } from '~/developer-testing/developer-testing.service';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { mockSigningProvider } from '~/signing/signing.mock';
import { testValues } from '~/test-utils/consts';
import { MockPolymesh } from '~/test-utils/mocks';
import { makeMockConfigProvider, MockAccountsService } from '~/test-utils/service-mocks';

const {
  testAccount: { address },
} = testValues;

describe('DeveloperTestingService', () => {
  let service: DeveloperTestingService;
  let mockPolymeshApi: MockPolymesh;
  let polymeshService: PolymeshService;
  let mockAccountsService: MockAccountsService;

  beforeAll(async () => {
    await cryptoWaitReady();
  });

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymesh();
    mockAccountsService = new MockAccountsService();

    const module: TestingModule = await Test.createTestingModule({
      imports: [PolymeshModule],
      providers: [
        DeveloperTestingService,
        AccountsService,
        mockSigningProvider,
        makeMockConfigProvider({ DEVELOPER_SUDO_MNEMONIC: '//Bob' }),
      ],
    })
      .overrideProvider(AccountsService)
      .useValue(mockAccountsService)
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .compile();

    polymeshService = module.get<PolymeshService>(PolymeshService);
    service = module.get<DeveloperTestingService>(DeveloperTestingService);

    polymeshService.execTransaction = jest.fn();
    mockPolymeshApi.network.getSs58Format.mockReturnValue(new BigNumber(42));
  });

  afterEach(async () => {
    await polymeshService.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTestAdmins', () => {
    it('should return test admin Identities', async () => {
      const secondaryAddress = 'someSecondaryAddress';
      when(mockAccountsService.findOne)
        .calledWith(address)
        .mockResolvedValue({
          getIdentity: jest.fn().mockResolvedValue('fakeId'),
        });

      when(mockAccountsService.findOne)
        .calledWith(secondaryAddress)
        .mockResolvedValue({
          getIdentity: jest.fn().mockResolvedValue('fakeSecondaryId'),
        });

      const params = {
        accounts: [
          { address, initialPolyx: new BigNumber(100) },
          { address: secondaryAddress, initialPolyx: new BigNumber(0) },
        ],
      };

      const identities = await service.createTestAdmins(params);

      expect(identities).toEqual(['fakeId', 'fakeSecondaryId']);
    });
  });

  describe('createTestAccounts', () => {
    it('should return test Identities', async () => {
      mockAccountsService.findOne.mockResolvedValue({
        getIdentity: jest.fn().mockResolvedValue('fakeId'),
      });

      const params = {
        accounts: [{ address, initialPolyx: new BigNumber(100) }],
        signer: 'test-admin',
      };

      const identities = await service.createTestAccounts(params);

      expect(identities).toEqual(['fakeId']);
    });

    it('should throw an error if an Identity is not made', async () => {
      mockAccountsService.findOne.mockResolvedValue({
        getIdentity: jest.fn().mockResolvedValue(null),
      });

      const params = {
        accounts: [{ address, initialPolyx: new BigNumber(100) }],
        signer: 'test-admin',
      };

      const expectedError = new AppInternalError(
        'At least one identity was not found which should have been made'
      );

      return expect(service.createTestAccounts(params)).rejects.toThrowError(expectedError);
    });

    it('should call execTransaction with the default sudo signer if `signer` is not specified', async () => {
      const params = { accounts: [{ address, initialPolyx: new BigNumber(10) }] };

      const defaultAdminAddress = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';

      when(mockAccountsService.findOne)
        .calledWith(address)
        .mockResolvedValue({
          getIdentity: jest.fn().mockResolvedValue('fakeId'),
        });

      await service.createTestAccounts(params);

      expect(polymeshService.execTransaction).toHaveBeenCalledWith(
        defaultAdminAddress,
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('createMockCdd', () => {
    it('should return a promise', async () => {
      const params = {
        address: 'address',
        initialPolyx: new BigNumber(10),
      };
      mockPolymeshApi.network.getSs58Format.mockReturnValue(new BigNumber(42));

      const result = service.createMockCdd(params);
      expect(result).toBeInstanceOf(Promise);
    });
  });
});
