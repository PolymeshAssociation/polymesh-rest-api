import { DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { GenericPolymeshTransaction } from '@polymeshassociation/polymesh-sdk/types';

import { AddressName } from '~/common/utils/amqp';
import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { MessageService } from '~/message/common/message.service';
import { OfflineStarterService } from '~/offline-starter/offline-starter.service';
import { MockPolymeshTransaction } from '~/test-utils/mocks';
import { mockMessageServiceProvider } from '~/test-utils/service-mocks';

describe('OfflineStarterService', () => {
  let service: OfflineStarterService;
  let mockMessageService: DeepMocked<MessageService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OfflineStarterService, mockMessageServiceProvider, mockPolymeshLoggerProvider],
    }).compile();

    mockMessageService = module.get<typeof mockMessageService>(MessageService);
    service = module.get<OfflineStarterService>(OfflineStarterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('method: beginTransaction', () => {
    const mockTx = new MockPolymeshTransaction();
    mockTx.toSignablePayload.mockReturnValue('mockPayload');
    const tx = mockTx as unknown as GenericPolymeshTransaction<unknown, unknown>;
    it('should submit the transaction to the queue', async () => {
      await service.beginTransaction(tx, { clientId: 'someId' });

      expect(mockMessageService.sendMessage).toHaveBeenCalledWith(
        AddressName.Requests,
        expect.objectContaining({ id: expect.any(String), payload: 'mockPayload' })
      );
    });
  });
});
