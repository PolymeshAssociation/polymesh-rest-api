import { DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';

import { QueueName } from '~/common/utils/amqp';
import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { MessageService } from '~/message/common/message.service';
import { AnyModel } from '~/offline-recorder/model/any.model';
import { OfflineRecorderService } from '~/offline-recorder/offline-recorder.service';
import { OfflineEventRepo } from '~/offline-recorder/repo/offline-event.repo';
import { mockMessageServiceProvider, mockOfflineRepoProvider } from '~/test-utils/service-mocks';

describe('OfflineRecorderService', () => {
  let service: OfflineRecorderService;
  let mockOfflineRepo: DeepMocked<OfflineEventRepo>;
  let mockMessageService: DeepMocked<MessageService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OfflineRecorderService,
        mockMessageServiceProvider,
        mockOfflineRepoProvider,
        mockPolymeshLoggerProvider,
      ],
    }).compile();

    mockOfflineRepo = module.get<typeof mockOfflineRepo>(OfflineEventRepo);
    mockMessageService = module.get<typeof mockMessageService>(MessageService);
    service = module.get<OfflineRecorderService>(OfflineRecorderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should have subscribed to the required topics', () => {
      expect(mockMessageService.registerListener).toHaveBeenCalledWith(
        QueueName.EventsLog,
        expect.any(Function),
        expect.any(Function)
      );
    });
  });

  describe('method: recordEvent', () => {
    it('should save an event', async () => {
      const msg = { id: 'someId' };

      await service.recordEvent(new AnyModel(msg));

      expect(mockOfflineRepo.recordEvent).toHaveBeenCalledWith(msg);
    });
  });
});
