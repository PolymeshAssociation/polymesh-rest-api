import { DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { ConfidentialTransactionStatus } from '@polymeshassociation/polymesh-sdk/types';

import { ConfidentialTransactionsController } from '~/confidential-transactions/confidential-transactions.controller';
import { ConfidentialTransactionsService } from '~/confidential-transactions/confidential-transactions.service';
import {
  createMockConfidentialAccount,
  createMockConfidentialAsset,
  createMockConfidentialTransaction,
  createMockIdentity,
} from '~/test-utils/mocks';
import { mockConfidentialTransactionsServiceProvider } from '~/test-utils/service-mocks';

describe('ConfidentialTransactionsController', () => {
  let controller: ConfidentialTransactionsController;
  let mockConfidentialTransactionsService: DeepMocked<ConfidentialTransactionsService>;
  const id = new BigNumber(1);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfidentialTransactionsController],
      providers: [mockConfidentialTransactionsServiceProvider],
    }).compile();

    mockConfidentialTransactionsService = module.get<typeof mockConfidentialTransactionsService>(
      ConfidentialTransactionsService
    );
    controller = module.get<ConfidentialTransactionsController>(ConfidentialTransactionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDetails', () => {
    it('should return the details of Confidential Trasaction', async () => {
      const details = {
        status: ConfidentialTransactionStatus.Pending,
        createdAt: new Date('2023/02/01'),
        memo: 'SOME_MEMO',
        venueId: new BigNumber(1),
      };
      const mockDetails = {
        ...details,
        createdAt: new BigNumber(details.createdAt.getTime()),
      };
      const mockLeg = {
        id: new BigNumber(0),
        sender: createMockConfidentialAccount({ publicKey: 'SENDER' }),
        receiver: createMockConfidentialAccount({ publicKey: 'RECEIVER' }),
        mediators: [createMockIdentity({ did: 'MEDIATOR' })],
        assetAuditors: [
          {
            asset: createMockConfidentialAsset({ id: 'SOME_ASSET_ID' }),
            auditors: [createMockConfidentialAccount({ publicKey: 'AUDITOR' })],
          },
        ],
      };
      const mockConfidentialTransaction = createMockConfidentialTransaction();

      mockConfidentialTransaction.details.mockResolvedValue(mockDetails);
      mockConfidentialTransaction.getLegs.mockResolvedValue([mockLeg]);

      mockConfidentialTransactionsService.findOne.mockResolvedValue(mockConfidentialTransaction);

      const result = await controller.getDetails({ id });

      const expectedLegs = [
        {
          id: mockLeg.id,
          sender: expect.objectContaining({ publicKey: 'SENDER' }),
          receiver: expect.objectContaining({ publicKey: 'RECEIVER' }),
          mediators: expect.arrayContaining([{ did: 'MEDIATOR' }]),
          assetAuditors: expect.arrayContaining([
            {
              asset: expect.objectContaining({ id: 'SOME_ASSET_ID' }),
              auditors: expect.arrayContaining([{ publicKey: 'AUDITOR' }]),
            },
          ]),
        },
      ];

      expect(result).toEqual({
        id,
        ...details,
        legs: expectedLegs,
      });
    });
  });
});
