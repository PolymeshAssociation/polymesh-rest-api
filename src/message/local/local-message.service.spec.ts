import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';

import { AppInternalError } from '~/common/errors';
import { AddressName, QueueName } from '~/common/utils/amqp';
import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { MessageService } from '~/message/common/message.service';
import { LocalMessageService } from '~/message/local/local-message.service';
import { OfflineRequestModel } from '~/offline-starter/models/offline-request.model';

describe('LocalMessageService generic test suite', () => {
  const logger = createMock<PolymeshLogger>();
  const service = new LocalMessageService(logger);

  MessageService.test(service);
});

describe('LocalMessageService', () => {
  let service: LocalMessageService;
  let logger: DeepMocked<PolymeshLogger>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LocalMessageService, mockPolymeshLoggerProvider],
    }).compile();

    service = module.get<LocalMessageService>(LocalMessageService);
    logger = module.get<typeof logger>(PolymeshLogger);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should extend MessageService', () => {
    expect(service).toBeInstanceOf(MessageService);
  });

  it('should validate messages', async () => {
    const mockListener = jest.fn();
    await service.registerListener(QueueName.Requests, mockListener, OfflineRequestModel);

    await expect(
      service.sendMessage(AddressName.Requests, { someKey: 'someValue' })
    ).rejects.toThrow(AppInternalError);
  });
});
