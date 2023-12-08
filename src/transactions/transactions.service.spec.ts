/* eslint-disable import/first */
const mockIsPolymeshTransaction = jest.fn();
const mockIsPolymeshTransactionBatch = jest.fn();
const mockIsPolymeshError = jest.fn();

import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { ProcedureOpts, TransactionStatus, TxTags } from '@polymeshassociation/polymesh-sdk/types';
import { when } from 'jest-when';

import { AppInternalError } from '~/common/errors';
import { ProcessMode, TransactionType } from '~/common/types';
import { EventsService } from '~/events/events.service';
import { EventType } from '~/events/types';
import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { SigningService } from '~/signing/services';
import { mockSigningProvider } from '~/signing/signing.mock';
import { SubscriptionsService } from '~/subscriptions/subscriptions.service';
import {
  CallbackFn,
  MockPolymeshTransaction,
  MockPolymeshTransactionBatch,
} from '~/test-utils/mocks';
import {
  MockEventsService,
  MockSigningService,
  MockSubscriptionsService,
} from '~/test-utils/service-mocks';
import transactionsConfig from '~/transactions/config/transactions.config';
import { TransactionsService } from '~/transactions/transactions.service';
import { TransactionResult } from '~/transactions/transactions.util';
import { Transaction } from '~/transactions/types';

jest.mock('@polymeshassociation/polymesh-sdk/utils', () => ({
  ...jest.requireActual('@polymeshassociation/polymesh-sdk/utils'),
  isPolymeshTransaction: mockIsPolymeshTransaction,
  isPolymeshTransactionBatch: mockIsPolymeshTransactionBatch,
  isPolymeshError: mockIsPolymeshError,
}));

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * A helper to create something that resembles a `prepareProcedure` method the SDK uses.
 * Its a bit messy, but is only needed for testing the transactions service
 */
const makeMockMethod = (
  transaction: MockPolymeshTransaction | MockPolymeshTransactionBatch
): any => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const mockMethod: any = (args: any, options: ProcedureOpts): Transaction =>
    transaction as unknown as Transaction;
  return mockMethod;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

describe('TransactionsService', () => {
  const signer = 'signer';
  const legitimacySecret = 'someSecret';
  let service: TransactionsService;

  let mockEventsService: MockEventsService;
  let mockSubscriptionsService: MockSubscriptionsService;
  let mockSigningService: MockSigningService;

  beforeEach(async () => {
    mockEventsService = new MockEventsService();
    mockSubscriptionsService = new MockSubscriptionsService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        mockPolymeshLoggerProvider,
        EventsService,
        SubscriptionsService,
        mockSigningProvider,
        {
          provide: transactionsConfig.KEY,
          useValue: { legitimacySecret },
        },
      ],
    })
      .overrideProvider(EventsService)
      .useValue(mockEventsService)
      .overrideProvider(SubscriptionsService)
      .useValue(mockSubscriptionsService)
      .compile();

    service = module.get<TransactionsService>(TransactionsService);
    mockSigningService = module.get<MockSigningService>(SigningService);
  });

  afterEach(() => {
    mockIsPolymeshTransaction.mockReset();
    mockIsPolymeshTransactionBatch.mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSigningAccount', () => {
    const address = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
    it('should return the address if given an address', async () => {
      mockSigningService.isAddress.mockReturnValue(true);
      const result = await service.getSigningAccount(address);

      expect(result).toEqual(address);
    });

    it('should return the address when given a handle', async () => {
      mockSigningService.isAddress.mockReturnValue(false);
      when(mockSigningService.getAddressByHandle).calledWith('alice').mockResolvedValue(address);
      const result = await service.getSigningAccount('alice');

      expect(result).toEqual(address);
    });
  });

  describe('submit (without webhookUrl)', () => {
    it('should process the transaction and return the result', async () => {
      const transaction: MockPolymeshTransaction = new MockPolymeshTransaction();
      mockIsPolymeshTransaction.mockReturnValue(true);
      const mockMethod = makeMockMethod(transaction);

      const { transactions, details } = (await service.submit(
        mockMethod,
        {},
        { signer, processMode: ProcessMode.Submit }
      )) as TransactionResult<undefined>;

      expect(transactions).toEqual([
        {
          blockHash: undefined,
          blockNumber: undefined,
          transactionHash: undefined,
          transactionTag: TxTags.asset.RegisterTicker,
          type: TransactionType.Single,
        },
      ]);
      expect(details).toBeDefined();
    });

    it('should process batch transactions and return the result', async () => {
      const transaction: MockPolymeshTransactionBatch = new MockPolymeshTransactionBatch();
      mockIsPolymeshTransaction.mockReturnValue(false);
      mockIsPolymeshTransactionBatch.mockReturnValue(true);
      const mockMethod = makeMockMethod(transaction);

      const { transactions, details } = (await service.submit(
        mockMethod,
        {},
        { signer, processMode: ProcessMode.Submit }
      )) as TransactionResult<undefined>;

      expect(transactions).toEqual([
        {
          blockHash: undefined,
          blockNumber: undefined,
          transactionHash: undefined,
          transactionTags: [TxTags.asset.RegisterTicker, TxTags.asset.CreateAsset],
          type: TransactionType.Batch,
        },
      ]);

      expect(details).toBeDefined();
    });

    it('should transform SDK errors into app errors', async () => {
      const transaction = new MockPolymeshTransaction();
      mockIsPolymeshTransaction.mockReturnValue(true);
      const mockMethod = makeMockMethod(transaction);

      mockIsPolymeshError.mockReturnValue(true);
      const fakeSdkError = new Error('fake error');
      transaction.run.mockRejectedValue(fakeSdkError);

      await expect(
        service.submit(mockMethod, {}, { signer, processMode: ProcessMode.Submit })
      ).rejects.toThrow(AppInternalError);
    });

    it('should throw an error if unknown details are received', async () => {
      const transaction: MockPolymeshTransactionBatch = new MockPolymeshTransactionBatch();
      mockIsPolymeshTransaction.mockReturnValue(false);
      mockIsPolymeshTransactionBatch.mockReturnValue(false);
      const mockMethod = makeMockMethod(transaction);

      await expect(
        service.submit(mockMethod, {}, { signer, processMode: ProcessMode.Submit })
      ).rejects.toThrow(AppInternalError);
    });
  });

  describe('submit (with webhookUrl)', () => {
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

      let statusCallback: CallbackFn<MockPolymeshTransaction> = async () => undefined;

      const unsubCallback = jest.fn();

      transaction.onStatusChange.mockImplementation(callback => {
        statusCallback = callback;
        return unsubCallback;
      });

      const mockMethod = makeMockMethod(transaction);

      mockIsPolymeshTransaction.mockReturnValue(true);

      const result = await service.submit(
        mockMethod,
        {},
        { signer, webhookUrl, processMode: ProcessMode.Submit }
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
        eventScope,
        webhookUrl,
        legitimacySecret,
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

      let statusCallback: CallbackFn<MockPolymeshTransactionBatch> = async () => undefined;

      const unsubCallback = jest.fn();

      transaction.onStatusChange.mockImplementation(callback => {
        statusCallback = callback;
        return unsubCallback;
      });
      transaction.run.mockRejectedValue(new Error('baz'));

      mockIsPolymeshTransaction.mockReturnValue(false);
      mockIsPolymeshTransactionBatch.mockRejectedValue(true);

      const mockMethod = makeMockMethod(transaction);

      const result = await service.submit(
        mockMethod,
        {},
        { signer, webhookUrl, processMode: ProcessMode.DryRun }
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
