import { DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { GenericPolymeshTransaction } from '@polymeshassociation/polymesh-sdk/types';

import { ArtemisService } from '~/artemis/artemis.service';
import { AddressName } from '~/common/utils/amqp';
import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { OfflineStarterService } from '~/offline-starter/offline-starter.service';
import { MockPolymeshTransaction } from '~/test-utils/mocks';
import { mockArtemisServiceProvider } from '~/test-utils/service-mocks';

describe('OfflineStarterService', () => {
  let service: OfflineStarterService;
  let mockArtemisService: DeepMocked<ArtemisService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OfflineStarterService, mockArtemisServiceProvider, mockPolymeshLoggerProvider],
    }).compile();

    mockArtemisService = module.get<typeof mockArtemisService>(ArtemisService);
    service = module.get<OfflineStarterService>(OfflineStarterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('method: beginTransaction', () => {
    it('should submit the transaction to the queue', async () => {
      const mockTx = new MockPolymeshTransaction();
      mockTx.toSignablePayload.mockReturnValue('mockPayload');
      const tx = mockTx as unknown as GenericPolymeshTransaction<unknown, unknown>;

      await service.beginTransaction(tx, { clientId: 'someId' });

      expect(mockArtemisService.sendMessage).toHaveBeenCalledWith(
        AddressName.Requests,
        expect.objectContaining({ id: expect.any(String), payload: 'mockPayload' })
      );
    });
  });
});
