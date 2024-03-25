import { DeepMocked } from '@golevelup/ts-jest';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { NetworkService } from '~/network/network.service';
import { extrinsicWithFees } from '~/test-utils/consts';
import { mockNetworkServiceProvider } from '~/test-utils/service-mocks';
import { TransactionDto } from '~/transactions/dto/transaction.dto';
import { ExtrinsicDetailsModel } from '~/transactions/models/extrinsic-details.model';
import { SubmitResultModel } from '~/transactions/models/submit-result.model';
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
    it('should throw NotFoundException if the transaction details are not found', () => {
      mockNetworkService.getTransactionByHash.mockResolvedValue(null);

      return expect(() =>
        controller.getTransactionByHash({ hash: 'someHash' })
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    describe('otherwise', () => {
      it('should return the transaction details', async () => {
        mockNetworkService.getTransactionByHash.mockResolvedValue(extrinsicWithFees);

        const result = await controller.getTransactionByHash({ hash: 'someHash' });

        expect(result).toEqual(new ExtrinsicDetailsModel(extrinsicWithFees));
      });
    });
  });

  describe('submit', () => {
    it('should call the service and return the results', async () => {
      const body = {
        method: '0x01',
        signature: '0x02',
        payload: {},
        rawPayload: {},
      } as unknown as TransactionDto;

      const txResult = 'fakeResult' as unknown as SubmitResultModel;

      mockNetworkService.submitTransaction.mockResolvedValue(txResult);

      const result = await controller.submitTransaction(body);
      expect(result).toEqual(txResult);
      expect(mockNetworkService.submitTransaction).toHaveBeenCalledWith(body);
    });
  });
});
