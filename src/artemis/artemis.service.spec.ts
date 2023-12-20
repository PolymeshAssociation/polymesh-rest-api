import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { IsString } from 'class-validator';
import { when } from 'jest-when';
import { EventContext } from 'rhea-promise';

import { ArtemisService } from '~/artemis/artemis.service';
import { clearEventLoop } from '~/common/utils';
import { TopicName } from '~/common/utils/amqp';
import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';

const mockSend = jest.fn();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const generateMockReceiver = (body: any): unknown => {
  return {
    // eslint-disable-next-line @typescript-eslint/ban-types
    on: (event: string, listener: Function): void => {
      const mockContext = createMock<EventContext>({
        message: {
          body,
        },
      });
      listener(mockContext);
    },
  };
};

const mockCreateReceiver = jest
  .fn()
  .mockImplementation(() => generateMockReceiver({ id: 'someId' }));

class StubModel {
  @IsString()
  id: string;

  constructor(model: StubModel) {
    Object.assign(this, model);
  }
}

const mockConnect = jest.fn().mockResolvedValue({
  createAwaitableSender: jest.fn().mockResolvedValue({ send: mockSend }),
  createReceiver: mockCreateReceiver,
});

jest.mock('rhea-promise', () => {
  return {
    ...jest.requireActual('rhea-promise'),
    Container: jest.fn().mockImplementation(() => {
      return {
        connect: mockConnect,
      };
    }),
  };
});

describe('ArtemisService', () => {
  let service: ArtemisService;
  let logger: DeepMocked<PolymeshLogger>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ArtemisService, mockPolymeshLoggerProvider],
    }).compile();

    service = module.get<ArtemisService>(ArtemisService);
    logger = module.get<typeof logger>(PolymeshLogger);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendMessage', () => {
    it('should send a message', async () => {
      const mockReceipt = 'mockReceipt';
      const otherMockReceipt = 'otherMockReceipt';

      const topicName = TopicName.Requests;
      const body = { payload: 'some payload' };
      const otherBody = { other: 'payload' };

      when(mockSend).calledWith({ body }, { timeoutInSeconds: 10 }).mockResolvedValue(mockReceipt);
      when(mockSend)
        .calledWith({ body: otherBody }, { timeoutInSeconds: 10 })
        .mockResolvedValue(otherMockReceipt);

      const receipt = await service.sendMessage(topicName, body);
      expect(receipt).toEqual(mockReceipt);

      const otherReceipt = await service.sendMessage(topicName, otherBody);
      expect(otherReceipt).toEqual(otherMockReceipt);
    });
  });

  describe('registerListener', () => {
    it('should register and call a listener', async () => {
      const listener = jest.fn();

      service.registerListener(TopicName.Requests, listener, StubModel);

      await clearEventLoop();

      expect(listener).toHaveBeenCalled();
    });

    it('should error if the receiver is called with an unexpected payload', async () => {
      const listener = jest.fn();
      const badBody = { id: 1 } as unknown;

      mockCreateReceiver.mockImplementationOnce(() => generateMockReceiver(badBody));

      service.registerListener(TopicName.Requests, listener, StubModel);

      await clearEventLoop();

      expect(logger.error).toHaveBeenCalled();
    });
  });
});
