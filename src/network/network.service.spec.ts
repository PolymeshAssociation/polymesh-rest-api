/* eslint-disable import/first */
import { Test, TestingModule } from '@nestjs/testing';

import { MockNetworkProperties } from '~/network/mocks/network-properties.mock';
import { NetworkService } from '~/network/network.service';
import { POLYMESH_API } from '~/polymesh/polymesh.consts';
import { PolymeshModule } from '~/polymesh/polymesh.module';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { MockPolymesh } from '~/test-utils/mocks';

describe('NetworkService', () => {
  let networkService: NetworkService;
  let polymeshService: PolymeshService;
  let mockPolymeshApi: MockPolymesh;

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
    console.log(networkService);
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
});
