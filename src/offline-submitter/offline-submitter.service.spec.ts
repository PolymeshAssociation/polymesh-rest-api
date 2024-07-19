import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { TransactionPayload } from '@polymeshassociation/polymesh-sdk/types';
import { when } from 'jest-when';

import { AddressName } from '~/common/utils/amqp';
import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { MessageService } from '~/message/common/message.service';
import { OfflineSignatureModel } from '~/offline-signer/models/offline-signature.model';
import { OfflineTxModel, OfflineTxStatus } from '~/offline-submitter/models/offline-tx.model';
import { OfflineSubmitterService } from '~/offline-submitter/offline-submitter.service';
import { OfflineTxRepo } from '~/offline-submitter/repos/offline-tx.repo';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { testValues } from '~/test-utils/consts';
import { mockPolymeshServiceProvider } from '~/test-utils/mocks';
import { mockMessageServiceProvider, mockOfflineTxRepoProvider } from '~/test-utils/service-mocks';

const { offlineTx } = testValues;

describe('OfflineSubmitterService', () => {
  let service: OfflineSubmitterService;
  let mockRepo: DeepMocked<OfflineTxRepo>;
  let mockMessageService: DeepMocked<MessageService>;
  let mockPolymeshService: DeepMocked<PolymeshService>;
  let offlineModel: OfflineTxModel;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OfflineSubmitterService,
        mockMessageServiceProvider,
        mockOfflineTxRepoProvider,
        mockPolymeshServiceProvider,
        mockPolymeshLoggerProvider,
      ],
    }).compile();

    mockRepo = module.get<typeof mockRepo>(OfflineTxRepo);
    mockMessageService = module.get<typeof mockMessageService>(MessageService);
    mockPolymeshService = module.get<typeof mockPolymeshService>(PolymeshService);
    service = module.get<OfflineSubmitterService>(OfflineSubmitterService);

    offlineModel = new OfflineTxModel({
      id: 'someId',
      payload: {} as TransactionPayload,
      status: OfflineTxStatus.Signed,
      signature: '0x01',
      nonce: 1,
      address: 'someAddress',
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should have subscribed to the required topics', () => {
      expect(mockMessageService.registerListener).toHaveBeenCalledWith(
        AddressName.Signatures,
        expect.any(Function),
        expect.any(Function)
      );
    });
  });
  describe('method: submit', () => {
    const signatureModel = new OfflineSignatureModel({
      id: 'someId',
      signature: '0x01',
      payload: offlineTx.payload,
    });
    it('should submit the transaction, update the DB, and publish events', async () => {
      when(mockRepo.createTx).mockResolvedValue(offlineModel);

      const networkMock = createMock<typeof mockPolymeshService.polymeshApi.network>();
      networkMock.submitTransaction.mockResolvedValue({
        blockHash: '0x02',
        transactionHash: '0x03',
        transactionIndex: new BigNumber(1),
      });

      mockPolymeshService.polymeshApi.network = networkMock;

      await service.submit(signatureModel);

      expect(mockRepo.updateTx).toHaveBeenCalledWith(
        'someId',
        expect.objectContaining({
          blockHash: '0x02',
          id: 'someId',
          payload: {},
          status: 'Finalized',
          txHash: '0x03',
          txIndex: '1',
        })
      );
      expect(mockMessageService.sendMessage).toHaveBeenCalledWith(
        AddressName.Finalizations,
        expect.objectContaining({
          blockHash: '0x02',
          transactionHash: '0x03',
          transactionIndex: '1',
        })
      );
    });
  });
});
