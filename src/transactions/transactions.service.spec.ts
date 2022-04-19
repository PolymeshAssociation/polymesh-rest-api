/* eslint-disable import/first */
const mockIsPolymeshTransaction = jest.fn();

import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { TransactionStatus, TxTags } from '@polymathnetwork/polymesh-sdk/types';

import { TransactionType } from '~/common/types';
import { EventsService } from '~/events/events.service';
import { EventType } from '~/events/types';
import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { SubscriptionsService } from '~/subscriptions/subscriptions.service';
import { MockPolymeshTransaction, MockPolymeshTransactionBatch } from '~/test-utils/mocks';
import { MockEventsService, MockSubscriptionsService } from '~/test-utils/service-mocks';
import { TransactionsService } from '~/transactions/transactions.service';
import { Transaction } from '~/transactions/types';

jest.mock('@polymathnetwork/polymesh-sdk/utils', () => ({
  ...jest.requireActual('@polymathnetwork/polymesh-sdk/utils'),
  isPolymeshTransaction: mockIsPolymeshTransaction,
}));

describe('TransactionsService', () => {
  let service: TransactionsService;

  let mockEventsService: MockEventsService;
  let mockSubscriptionsService: MockSubscriptionsService;

  beforeEach(async () => {
    mockEventsService = new MockEventsService();
    mockSubscriptionsService = new MockSubscriptionsService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        mockPolymeshLoggerProvider,
        EventsService,
        SubscriptionsService,
      ],
    })
      .overrideProvider(EventsService)
      .useValue(mockEventsService)
      .overrideProvider(SubscriptionsService)
      .useValue(mockSubscriptionsService)
      .compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  afterEach(() => {
    mockIsPolymeshTransaction.mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submitAndSubscribe', () => {
    const subscriptionId = 1;
    const transactionHash = '0xabc';
    const eventType = EventType.TransactionUpdate;
    const eventScope = '1';
    const blockHash = '0xdef';
    const blockNumber = new BigNumber(1);
    const webhookUrl = 'http://www.example.com';

    beforeEach(() => {
      mockSubscriptionsService.createSubscription.mockReturnValue(subscriptionId);
    });

    it('should create a subscription, run the transaction, listen to changes on it (creating events), and return the first notification payload (single)', async () => {
      const transaction: MockPolymeshTransaction = new MockPolymeshTransaction();

      // this is a bit ugly but it's better than calling the submit function a bunch of times
      let statusCallback: (tx: typeof transaction) => Promise<void> = async () => undefined;

      const unsubCallback = jest.fn();

      transaction.onStatusChange.mockImplementation(callback => {
        statusCallback = callback;
        return unsubCallback;
      });

      mockIsPolymeshTransaction.mockReturnValue(true);

      const result = await service.submitAndSubscribe(
        transaction as unknown as Transaction,
        webhookUrl
      );

      const expectedPayload = {
        type: TransactionType.Single,
        transactionTag: TxTags.asset.RegisterTicker,
        status: TransactionStatus.Unapproved,
      };
      expect(result).toEqual({
        type: eventType,
        subscriptionId,
        scope: eventScope,
        payload: expectedPayload,
        nonce: 0,
      });
      expect(mockSubscriptionsService.createSubscription).toHaveBeenCalledWith({
        eventType,
        eventScope: eventScope,
        webhookUrl,
      });

      // test different status updates
      transaction.status = TransactionStatus.Running;
      transaction.txHash = transactionHash;
      await statusCallback(transaction);

      expect(mockEventsService.createEvent).toHaveBeenCalledWith({
        type: EventType.TransactionUpdate,
        scope: eventScope,
        payload: {
          ...expectedPayload,
          status: TransactionStatus.Running,
          transactionHash,
        },
      });

      mockSubscriptionsService.findAll.mockReturnValue([{ id: subscriptionId }]);

      transaction.status = TransactionStatus.Succeeded;
      transaction.blockHash = blockHash;
      transaction.blockNumber = blockNumber;

      await statusCallback(transaction);

      expect(mockEventsService.createEvent).toHaveBeenCalledWith({
        type: EventType.TransactionUpdate,
        scope: eventScope,
        payload: {
          ...expectedPayload,
          status: TransactionStatus.Succeeded,
          transactionHash,
          blockHash,
          blockNumber: blockNumber.toString(),
          result: 'placeholder',
        },
      });
      expect(unsubCallback).toHaveBeenCalled();
      expect(mockSubscriptionsService.batchMarkAsDone).toHaveBeenCalledWith([subscriptionId]);
    });

    it('should create a subscription, run the transaction, listen to changes on it (creating events), and return the first notification payload (batch)', async () => {
      const transaction = new MockPolymeshTransactionBatch();

      // this is a bit ugly but it's better than calling the submit function a bunch of times
      let statusCallback: (tx: typeof transaction) => Promise<void> = async () => undefined;

      const unsubCallback = jest.fn();

      transaction.onStatusChange.mockImplementation(callback => {
        statusCallback = callback;
        return unsubCallback;
      });
      transaction.run.mockRejectedValue(new Error('baz'));

      mockIsPolymeshTransaction.mockReturnValue(false);

      const result = await service.submitAndSubscribe(
        transaction as unknown as Transaction,
        webhookUrl
      );

      expect(mockPolymeshLoggerProvider.useValue.error).toHaveBeenCalled();

      expect(result).toEqual({
        subscriptionId,
        type: eventType,
        scope: eventScope,
        nonce: 0,
        payload: {
          type: TransactionType.Batch,
          transactionTags: [TxTags.asset.RegisterTicker, TxTags.asset.CreateAsset],
          status: TransactionStatus.Unapproved,
        },
      });

      const errorMessage = 'foo';

      transaction.status = TransactionStatus.Failed;
      transaction.txHash = transactionHash;
      transaction.blockHash = blockHash;
      transaction.blockNumber = blockNumber;
      transaction.error = new Error(errorMessage);

      await statusCallback(transaction);

      expect(mockEventsService.createEvent).toHaveBeenCalledWith({
        type: EventType.TransactionUpdate,
        scope: eventScope,
        payload: {
          type: TransactionType.Batch,
          transactionTags: [TxTags.asset.RegisterTicker, TxTags.asset.CreateAsset],
          status: TransactionStatus.Failed,
          transactionHash,
          blockHash,
          blockNumber: blockNumber.toString(),
          error: errorMessage,
        },
      });

      const message = 'bar';
      mockEventsService.createEvent.mockImplementation(() => {
        throw new Error(message);
      });

      await statusCallback(transaction);

      expect(mockPolymeshLoggerProvider.useValue.error).toHaveBeenCalledWith(
        'Error while handling status change for transaction "1"',
        message
      );

      mockEventsService.createEvent.mockImplementation(() => {
        throw message;
      });

      await statusCallback(transaction);

      expect(mockPolymeshLoggerProvider.useValue.error).toHaveBeenCalledWith(
        'Error while handling status change for transaction "1"',
        message
      );
    });
  });
});
