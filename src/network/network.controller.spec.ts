import { DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { MockMiddlewareMetadata } from '~/network/mocks/middleware-metadata.mock';
import { MockNetworkProperties } from '~/network/mocks/network-properties.mock';
import { MiddlewareMetadataModel } from '~/network/models/middleware-metadata.model';
import { NetworkBlockModel } from '~/network/models/network-block.model';
import { NetworkController } from '~/network/network.controller';
import { NetworkService } from '~/network/network.service';
import { mockNetworkServiceProvider } from '~/test-utils/service-mocks';

describe('NetworkController', () => {
  let controller: NetworkController;
  let mockNetworkService: DeepMocked<NetworkService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NetworkController],
      providers: [mockNetworkServiceProvider],
    }).compile();

    mockNetworkService = mockNetworkServiceProvider.useValue as DeepMocked<NetworkService>;
    controller = module.get<NetworkController>(NetworkController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getNetworkProperties', () => {
    it('should return network properties', async () => {
      const mockResult = new MockNetworkProperties();

      mockNetworkService.getNetworkProperties.mockResolvedValue(mockResult);

      const result = await controller.getNetworkProperties();

      expect(result).toEqual(mockResult);
    });
  });

  describe('getLatestBlock', () => {
    it('should return latest block number as NetworkBlockModel', async () => {
      const mockLatestBlock = new BigNumber(1);
      const mockResult = new NetworkBlockModel({ id: mockLatestBlock });
      mockNetworkService.getLatestBlock.mockResolvedValue(mockLatestBlock);

      const result = await controller.getLatestBlock();

      expect(result).toEqual(mockResult);
    });
  });

  describe('getMiddlewareMetadata', () => {
    it('should return middleware metadata', async () => {
      const mockServiceResult = new MockMiddlewareMetadata();

      mockNetworkService.getMiddlewareMetadata.mockResolvedValue(mockServiceResult);

      const modelResult = new MiddlewareMetadataModel(mockServiceResult);
      const result = await controller.getMiddleWareMetaData();

      expect(result).toEqual(modelResult);
    });

    it('should throw NotFoundException if middleware metadata is not found', async () => {
      mockNetworkService.getMiddlewareMetadata.mockResolvedValue(null);

      await expect(controller.getMiddleWareMetaData()).rejects.toThrowError();
    });
  });
});
