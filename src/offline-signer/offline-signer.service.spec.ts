import { DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { TransactionPayload } from '@polymeshassociation/polymesh-sdk/types';

import { AddressName } from '~/common/utils/amqp';
import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { MessageService } from '~/message/common/message.service';
import { OfflineSignerService } from '~/offline-signer/offline-signer.service';
import { OfflineRequestModel } from '~/offline-starter/models/offline-request.model';
import { SigningService } from '~/signing/services';
import { mockSigningProvider } from '~/signing/signing.mock';
import { mockMessageServiceProvider } from '~/test-utils/service-mocks';

describe('OfflineSignerService', () => {
  let service: OfflineSignerService;
  let mockMessageService: DeepMocked<MessageService>;
  let mockSigningService: DeepMocked<SigningService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OfflineSignerService,
        mockMessageServiceProvider,
        mockSigningProvider,
        mockPolymeshLoggerProvider,
      ],
    }).compile();

    mockMessageService = module.get<typeof mockMessageService>(MessageService);
    mockSigningService = module.get<typeof mockSigningService>(SigningService);
    service = module.get<OfflineSignerService>(OfflineSignerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should have subscribed to the required topics', () => {
      expect(mockMessageService.registerListener).toHaveBeenCalledWith(
        AddressName.Requests,
        expect.any(Function),
        expect.any(Function)
      );
    });
  });

  describe('method: autoSign', () => {
    it('should sign and publish the signature', async () => {
      const model = new OfflineRequestModel({
        id: 'someId',
        payload: {} as TransactionPayload,
      });

      const mockSignature = '0x01';

      mockSigningService.signPayload.mockResolvedValue(mockSignature);

      await service.autoSign(model);

      expect(mockMessageService.sendMessage).toHaveBeenCalledWith(AddressName.Signatures, {
        id: 'someId',
        signature: mockSignature,
        payload: expect.any(Object),
      });
    });
  });
});
