/* eslint-disable import/first */
const mockHexStripPrefix = jest.fn().mockImplementation(params => params);

import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { MockMiddlewareMetadata } from '~/network/mocks/middleware-metadata.mock';
import { MockNetworkProperties } from '~/network/mocks/network-properties.mock';
import { NetworkService } from '~/network/network.service';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { extrinsicWithFees, testValues } from '~/test-utils/consts';
import { MockPolymesh } from '~/test-utils/mocks';
import { TransactionDto } from '~/transactions/dto/transaction.dto';

jest.mock('@polkadot/util', () => ({
  ...jest.requireActual('@polkadot/util'),
  hexStripPrefix: mockHexStripPrefix,
}));

describe('NetworkService', () => {
  let networkService: NetworkService;
  let polymeshService: PolymeshService;
  let mockPolymeshApi: MockPolymesh;

  const { testAccount } = testValues;

  beforeEach(async () => {
    mockPolymeshApi = new MockPolymesh();

    const module: TestingModule = await Test.createTestingModule({
      imports: [PolymeshModule],
      providers: [NetworkService],
    })
      .overrideProvider(POLYMESH_API)
      .useValue(mockPolymeshApi)
      .compile();

    networkService = module.get<NetworkService>(NetworkService);
    polymeshService = module.get<PolymeshService>(PolymeshService);
  });

  afterEach(async () => {
    await polymeshService.close();
  });

  it('should be defined', () => {
    expect(networkService).toBeDefined();
  });

  describe('getNetworkProperties', () => {
    it('should return network properties', async () => {
      const networkProperties = new MockNetworkProperties();

      mockPolymeshApi.network.getNetworkProperties.mockReturnValue(networkProperties);

      const result = await networkService.getNetworkProperties();

      expect(result).toBe(networkProperties);
    });
  });

  describe('getVersion', () => {
    it('should return chain version', async () => {
      const version = '6.1.0';

      mockPolymeshApi.network.getVersion.mockReturnValue(version);

      const result = await networkService.getVersion();

      expect(result).toBe(version);
    });
  });

  describe('getLatestBlock', () => {
    it('should latest block ID', async () => {
      const mockResult = new BigNumber(1);

      mockPolymeshApi.network.getLatestBlock.mockReturnValue(mockResult);

      const result = await networkService.getLatestBlock();

      expect(result).toBe(mockResult);
    });
  });

  describe('getTreasuryAccount', () => {
    it("should return the chain's treasury Account", async () => {
      mockPolymeshApi.network.getTreasuryAccount.mockReturnValue(testAccount);

      const result = networkService.getTreasuryAccount();

      expect(result).toBe(testAccount);
    });
  });

  describe('getTransactionByHash', () => {
    it('should return the extrinsic details', async () => {
      mockPolymeshApi.network.getTransactionByHash.mockReturnValue(extrinsicWithFees);

      const result = await networkService.getTransactionByHash('someHash');

      expect(result).toEqual(extrinsicWithFees);
    });
  });

  describe('submitTransaction', () => {
    it('should return the transaction details', async () => {
      mockPolymeshApi.network.submitTransaction.mockReturnValue(extrinsicWithFees);

      const signature = '0x02';

      const mockBody = {
        signature,
        payload: {},
        rawPayload: {},
        method: '0x01',
      } as unknown as TransactionDto;
      const result = await networkService.submitTransaction(mockBody);

      expect(result).toEqual(extrinsicWithFees);
    });
  });

  describe('getMiddlewareMetadata', () => {
    it('should return middleware metadata', async () => {
      const middlewareMetadata = new MockMiddlewareMetadata();

      mockPolymeshApi.network.getMiddlewareMetadata.mockReturnValue(middlewareMetadata);

      const result = await networkService.getMiddlewareMetadata();

      expect(result).toBe(middlewareMetadata);
    });
  });
});
