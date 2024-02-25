import { DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import {
  ConfidentialTransaction,
  ConfidentialVenue,
  TxTags,
} from '@polymeshassociation/polymesh-sdk/types';
import { when } from 'jest-when';

import { ConfidentialTransactionsService } from '~/confidential-transactions/confidential-transactions.service';
import { ConfidentialVenuesController } from '~/confidential-transactions/confidential-venues.controller';
import { ConfidentialTransactionLegDto } from '~/confidential-transactions/dto/confidential-transaction-leg.dto';
import { CreatedConfidentialTransactionModel } from '~/confidential-transactions/models/created-confidential-transaction.model';
import { CreatedConfidentialVenueModel } from '~/confidential-transactions/models/created-confidential-venue.model';
import { getMockTransaction, testValues } from '~/test-utils/consts';
import {
  createMockConfidentialTransaction,
  createMockConfidentialVenue,
  createMockIdentity,
  createMockTransactionResult,
} from '~/test-utils/mocks';
import { mockConfidentialTransactionsServiceProvider } from '~/test-utils/service-mocks';

const { signer, txResult } = testValues;

describe('ConfidentialVenuesController', () => {
  let controller: ConfidentialVenuesController;
  let mockConfidentialTransactionsService: DeepMocked<ConfidentialTransactionsService>;
  const id = new BigNumber(1);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfidentialVenuesController],
      providers: [mockConfidentialTransactionsServiceProvider],
    }).compile();

    mockConfidentialTransactionsService = module.get<typeof mockConfidentialTransactionsService>(
      ConfidentialTransactionsService
    );
    controller = module.get<ConfidentialVenuesController>(ConfidentialVenuesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCreator', () => {
    it('should get the creator of a Confidential Venue', async () => {
      mockConfidentialTransactionsService.getVenueCreator.mockResolvedValue(
        createMockIdentity({ did: 'CREATOR_DID' })
      );

      const result = await controller.getCreator({ id });

      expect(result).toEqual(expect.objectContaining({ did: 'CREATOR_DID' }));
    });
  });

  describe('createVenue', () => {
    it('should call the service and return the results', async () => {
      const input = {
        signer,
      };

      const mockVenue = createMockConfidentialVenue();
      const transaction = getMockTransaction(TxTags.confidentialAsset.CreateVenue);
      const testTxResult = createMockTransactionResult<ConfidentialVenue>({
        ...txResult,
        transactions: [transaction],
        result: mockVenue,
      });

      when(mockConfidentialTransactionsService.createConfidentialVenue)
        .calledWith(input)
        .mockResolvedValue(testTxResult);

      const result = await controller.createVenue(input);
      expect(result).toEqual(
        new CreatedConfidentialVenueModel({
          ...txResult,
          transactions: [transaction],
          confidentialVenue: mockVenue,
        })
      );
    });
  });

  describe('createConfidentialTransaction', () => {
    it('should call the service and return the results', async () => {
      const input = {
        signer,
        legs: 'some_legs' as unknown as ConfidentialTransactionLegDto[],
        memo: 'some_memo',
      };

      const venueId = new BigNumber(1);

      const mockResult = createMockConfidentialTransaction();
      const transaction = getMockTransaction(TxTags.confidentialAsset.CreateVenue);
      const testTxResult = createMockTransactionResult<ConfidentialTransaction>({
        ...txResult,
        transactions: [transaction],
        result: mockResult,
      });

      when(mockConfidentialTransactionsService.createConfidentialTransaction)
        .calledWith(venueId, input)
        .mockResolvedValue(testTxResult);

      const result = await controller.createConfidentialTransaction({ id: venueId }, input);
      expect(result).toEqual(
        new CreatedConfidentialTransactionModel({
          ...txResult,
          transactions: [transaction],
          confidentialTransaction: mockResult,
        })
      );
    });
  });
});
