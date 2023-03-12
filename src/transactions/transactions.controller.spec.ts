import { DeepMocked } from '@golevelup/ts-jest';
import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';

import { NetworkService } from '~/network/network.service';
import { extrinsicWithFees } from '~/test-utils/consts';
import { createMockResponseObject } from '~/test-utils/mocks';
import { mockNetworkServiceProvider } from '~/test-utils/service-mocks';
import { ExtrinsicDetailsModel } from '~/transactions/models/extrinsic-details.model';
import { TransactionsController } from '~/transactions/transactions.controller';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let mockNetworkService: DeepMocked<NetworkService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [mockNetworkServiceProvider],
    }).compile();

    mockNetworkService = mockNetworkServiceProvider.useValue as DeepMocked<NetworkService>;

    controller = module.get<TransactionsController>(TransactionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getTransactionByHash', () => {
    let mockResponse: DeepMocked<Response>;

    beforeEach(() => {
      mockResponse = createMockResponseObject();
    });
    it(`should return the ${HttpStatus.NO_CONTENT} if the no transaction is found for given hash`, async () => {
      mockNetworkService.getTransactionByHash.mockResolvedValue(null);

      await controller.getTransactionByHash({ hash: 'someHash' }, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
    });

    it('should return the extrinsic details', async () => {
      mockNetworkService.getTransactionByHash.mockResolvedValue(extrinsicWithFees);

      await controller.getTransactionByHash({ hash: 'someHash' }, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(new ExtrinsicDetailsModel(extrinsicWithFees));
    });
  });
});
