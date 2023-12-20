import { DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';

import { ArtemisService } from '~/artemis/artemis.service';
import { TopicName } from '~/common/utils/amqp';
import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { OfflineRecorderService } from '~/offline-recorder/offline-recorder.service';
import { OfflineEventRepo } from '~/offline-recorder/repo/offline-event.repo';
import { mockArtemisServiceProvider, mockOfflineRepoProvider } from '~/test-utils/service-mocks';

describe('OfflineRecorderService', () => {
  let service: OfflineRecorderService;
  let mockOfflineRepo: DeepMocked<OfflineEventRepo>;
  let mockArtemisService: DeepMocked<ArtemisService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OfflineRecorderService,
        mockArtemisServiceProvider,
        mockOfflineRepoProvider,
        mockPolymeshLoggerProvider,
      ],
    }).compile();

    mockOfflineRepo = module.get<typeof mockOfflineRepo>(OfflineEventRepo);
    mockArtemisService = module.get<typeof mockArtemisService>(ArtemisService);
    service = module.get<OfflineRecorderService>(OfflineRecorderService);
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

      expect(mockArtemisService.registerListener).toHaveBeenCalledWith(
        TopicName.Signatures,
        expect.any(Function),
        expect.any(Function)
      );

      expect(mockArtemisService.registerListener).toHaveBeenCalledWith(
        TopicName.Finalizations,
        expect.any(Function),
        expect.any(Function)
      );
    });
  });

  describe('method: recordEvent', () => {
    it('should save an event', async () => {
      const msg = { id: 'someId' };

      await service.recordEvent(TopicName.Requests, msg);

      expect(mockOfflineRepo.recordEvent).toHaveBeenCalledWith(TopicName.Requests, msg);
    });
  });
});
