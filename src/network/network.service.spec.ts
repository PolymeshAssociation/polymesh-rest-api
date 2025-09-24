/* eslint-disable import/first */
const mockHexStripPrefix = jest.fn().mockImplementation(params => params);

import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { TxTags } from '@polymeshassociation/polymesh-sdk/types';

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

  describe('getTreasuryBalance', () => {
    it('should return the treasury balance', async () => {
      const balance = new BigNumber(100);

      mockPolymeshApi.network.getTreasuryBalance.mockResolvedValue(balance);

      const result = await networkService.getTreasuryBalance();

      expect(result).toBe(balance);
      expect(mockPolymeshApi.network.getTreasuryBalance).toHaveBeenCalled();
    });
  });

  describe('getProtocolFees', () => {
    it('should return protocol fees for the provided tags', async () => {
      const tag = TxTags.asset.CreateAsset;
      const protocolFees = [{ tag, fees: new BigNumber(1) }];

      mockPolymeshApi.network.getProtocolFees.mockResolvedValue(protocolFees);

      const result = await networkService.getProtocolFees([tag]);

      expect(result).toBe(protocolFees);
      expect(mockPolymeshApi.network.getProtocolFees).toHaveBeenCalledWith({
        tags: [tag],
        blockHash: undefined,
      });
    });

    it('should forward block hash when provided', async () => {
      const tag = TxTags.asset.CreateAsset;
      const blockHash = '0x123';
      const protocolFees = [{ tag, fees: new BigNumber(2) }];

      mockPolymeshApi.network.getProtocolFees.mockResolvedValue(protocolFees);

      const result = await networkService.getProtocolFees([tag], blockHash);

      expect(result).toBe(protocolFees);
      expect(mockPolymeshApi.network.getProtocolFees).toHaveBeenCalledWith({
        tags: [tag],
        blockHash,
      });
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
