import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { MockNetworkProperties } from '~/network/mocks/network-properties.mock';
import { NetworkService } from '~/network/network.service';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { testValues } from '~/test-utils/consts';
import { MockPolymesh } from '~/test-utils/mocks';

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
});
