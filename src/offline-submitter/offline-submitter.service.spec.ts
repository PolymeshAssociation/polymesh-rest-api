import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { TransactionPayload } from '@polymeshassociation/polymesh-sdk/types';
import { when } from 'jest-when';

import { ArtemisService } from '~/artemis/artemis.service';
import { AddressName } from '~/common/utils/amqp';
import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { OfflineSignatureModel } from '~/offline-signer/models/offline-signature.model';
import { OfflineTxModel, OfflineTxStatus } from '~/offline-submitter/models/offline-tx.model';
import { OfflineSubmitterService } from '~/offline-submitter/offline-submitter.service';
import { OfflineTxRepo } from '~/offline-submitter/repos/offline-tx.repo';
import { PolymeshService } from '~/polymesh/polymesh.service';
import { testValues } from '~/test-utils/consts';
import { mockPolymeshServiceProvider } from '~/test-utils/mocks';
import { mockArtemisServiceProvider, mockOfflineTxRepoProvider } from '~/test-utils/service-mocks';

const { offlineTx } = testValues;

describe('OfflineSubmitterService', () => {
  let service: OfflineSubmitterService;
  let mockRepo: DeepMocked<OfflineTxRepo>;
  let mockArtemisService: DeepMocked<ArtemisService>;
  let mockPolymeshService: DeepMocked<PolymeshService>;
  let offlineModel: OfflineTxModel;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OfflineSubmitterService,
        mockArtemisServiceProvider,
        mockOfflineTxRepoProvider,
        mockPolymeshServiceProvider,
        mockPolymeshLoggerProvider,
      ],
    }).compile();

    mockRepo = module.get<typeof mockRepo>(OfflineTxRepo);
    mockArtemisService = module.get<typeof mockArtemisService>(ArtemisService);
    mockPolymeshService = module.get<typeof mockPolymeshService>(PolymeshService);
    service = module.get<OfflineSubmitterService>(OfflineSubmitterService);

    offlineModel = new OfflineTxModel({
      id: 'someId',
      payload: {} as TransactionPayload,
      status: OfflineTxStatus.Requested,
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should have subscribed to the required topics', () => {
      expect(mockArtemisService.registerListener).toHaveBeenCalledWith(
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
        txHash: '0x03',
        txIndex: 1,
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
          txIndex: 1,
        })
      );
      expect(mockArtemisService.sendMessage).toHaveBeenCalledWith(
        AddressName.Finalizations,
        expect.objectContaining({
          blockHash: '0x02',
          txHash: '0x03',
          txIndex: 1,
        })
      );
    });
  });
});
