import { DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { TransactionPayload } from '@polymeshassociation/polymesh-sdk/types';

import { ArtemisService } from '~/artemis/artemis.service';
import { AddressName } from '~/common/utils/amqp';
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
        AddressName.Requests,
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

      mockSigningService.signPayload.mockResolvedValue(mockSignature);

      await service.autoSign(model);

      expect(mockArtemisService.sendMessage).toHaveBeenCalledWith(AddressName.Signatures, {
        id: 'someId',
        signature: mockSignature,
        payload: expect.any(Object),
      });
    });
  });
});
