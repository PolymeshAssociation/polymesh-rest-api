import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { TransactionPayload } from '@polymeshassociation/polymesh-sdk/types';
import { PolkadotSigner, SigningManager } from '@polymeshassociation/signing-manager-types';

import { ArtemisService } from '~/artemis/artemis.service';
import { TopicName } from '~/common/utils/amqp';
import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { OfflineSignerService } from '~/offline-signer/offline-signer.service';
import { OfflineTxModel, OfflineTxStatus } from '~/offline-submitter/models/offline-tx.model';
import { SigningService } from '~/signing/services';
import { mockSigningProvider } from '~/signing/signing.mock';
import { mockArtemisServiceProvider } from '~/test-utils/service-mocks';

describe('OfflineSignerService', () => {
  let service: OfflineSignerService;
  let mockArtemisService: DeepMocked<ArtemisService>;
  let mockSigningService: DeepMocked<SigningService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OfflineSignerService,
        mockArtemisServiceProvider,
        mockSigningProvider,
        mockPolymeshLoggerProvider,
      ],
    }).compile();

    mockArtemisService = module.get<typeof mockArtemisService>(ArtemisService);
    mockSigningService = module.get<typeof mockSigningService>(SigningService);
    service = module.get<OfflineSignerService>(OfflineSignerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should have subscribed to the required topics', () => {
      expect(mockArtemisService.registerListener).toHaveBeenCalledWith(
        TopicName.Requests,
        expect.any(Function),
        expect.any(Function)
      );
    });
  });

  describe('method: autoSign', () => {
    it('should sign and publish the signature', async () => {
      const model = new OfflineTxModel({
        id: 'someId',
        payload: {} as TransactionPayload,
        status: OfflineTxStatus.Requested,
      });

      const mockSignature = '0x01';

      const mockSigningManager = createMock<SigningManager>();
      const mockExternalSigner = createMock<PolkadotSigner>();
      mockExternalSigner.signPayload.mockResolvedValue({ id: 1, signature: mockSignature });
      mockSigningManager.getExternalSigner.mockReturnValue(mockExternalSigner);
      mockSigningService.getSigningManager.mockReturnValue(mockSigningManager);

      await service.autoSign(model);

      expect(mockArtemisService.sendMessage).toHaveBeenCalledWith(TopicName.Signatures, {
        id: 'someId',
        signature: mockSignature,
      });
    });
  });
});
