import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { IsString } from 'class-validator';
import { when } from 'jest-when';
import { EventContext } from 'rhea-promise';

import { AppInternalError } from '~/common/errors';
import { clearEventLoop } from '~/common/utils';
import { AddressName, QueueName } from '~/common/utils/amqp';
import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { ArtemisService } from '~/message/artemis/artemis.service';
import { ArtemisConfig } from '~/message/artemis/utils';
import { MessageService } from '~/message/common/message.service';

const mockSend = jest.fn();
const mockConnectionClose = jest.fn();
const mockSendClose = jest.fn();
const mockAccept = jest.fn();
const mockReject = jest.fn();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const generateMockReceiver = (body: any, withDelivery = true): unknown => {
  return {
    // eslint-disable-next-line @typescript-eslint/ban-types
    on: (event: string, listener: Function): void => {
      const mockContext = createMock<EventContext>({
        message: {
          body,
        },
        delivery: withDelivery
          ? {
              accept: mockAccept,
              reject: mockReject,
            }
          : undefined,
      });
      listener(mockContext);
    },
    close: jest.fn(),
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
  createAwaitableSender: jest.fn().mockResolvedValue({ send: mockSend, close: mockSendClose }),
  createReceiver: mockCreateReceiver,
  close: mockConnectionClose,
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

const mockConfig: ArtemisConfig = {
  type: 'artemis',
  port: 1,
  username: 'someUser',
  password: 'somePassword',
  host: 'http://example.com',
  operationTimeoutInSeconds: 10,
  transport: 'tcp',
  configured: true,
};

const mockReceipt = { id: 1 };
const otherMockReceipt = { id: 2 };

describe('ArtemisService generic test suite', () => {
  const logger = createMock<PolymeshLogger>();

  const service = new ArtemisService(logger, mockConfig);

  mockSend.mockResolvedValue(mockReceipt);

  MessageService.test(service);
});

describe('ArtemisService', () => {
  let service: ArtemisService;
  let logger: DeepMocked<PolymeshLogger>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArtemisService,
        mockPolymeshLoggerProvider,
        { provide: 'ARTEMIS_CONFIG', useValue: mockConfig },
      ],
    }).compile();

    service = module.get<ArtemisService>(ArtemisService);
    logger = module.get<typeof logger>(PolymeshLogger);
    mockSend.mockResolvedValue(mockReceipt);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw an error if constructed with unconfigured config', () => {
    expect(() => new ArtemisService(logger, { configured: false, type: 'artemis' })).toThrow(
      AppInternalError
    );
  });

  describe('sendMessage', () => {
    it('should send a message', async () => {
      const topicName = AddressName.Requests;
      const body = { payload: 'some payload' };
      const otherBody = { other: 'payload' };

      when(mockSend).calledWith({ body }, { timeoutInSeconds: 10 }).mockResolvedValue(mockReceipt);
      when(mockSend)
        .calledWith({ body: otherBody }, { timeoutInSeconds: 10 })
        .mockResolvedValue(otherMockReceipt);

      const receipt = await service.sendMessage(topicName, body);
      expect(receipt).toEqual(expect.objectContaining({ id: new BigNumber(mockReceipt.id) }));

      const otherReceipt = await service.sendMessage(topicName, otherBody);
      expect(otherReceipt).toEqual(
        expect.objectContaining({ id: new BigNumber(otherMockReceipt.id) })
      );
    });
  });

  describe('registerListener', () => {
    it('should register and call a listener, which accepts the message', async () => {
      const listener = jest.fn();

      service.registerListener(QueueName.Requests, listener, StubModel);

      await clearEventLoop();

      expect(listener).toHaveBeenCalled();
      expect(mockAccept).toHaveBeenCalled();
    });

    it('should error if the receiver is called with an unexpected payload', async () => {
      const listener = jest.fn();
      const badBody = { id: 1 } as unknown;

      mockCreateReceiver.mockImplementationOnce(() => generateMockReceiver(badBody));

      service.registerListener(QueueName.Requests, listener, StubModel);

      await clearEventLoop();

      expect(logger.error).toHaveBeenCalled();
    });

    it('should reject the message if the listener throws an error', async () => {
      const mockError = new Error('some error');
      const listener = jest.fn().mockRejectedValue(mockError);

      service.registerListener(QueueName.Requests, listener, StubModel);

      await clearEventLoop();

      expect(logger.error).toHaveBeenCalled();
      expect(mockReject).toHaveBeenCalled();
    });
  });

  describe('onApplicationShutdown', () => {
    it('should close down all senders, receivers and the connection', async () => {
      const listener = jest.fn();

      await service.sendMessage(AddressName.Requests, { id: 1 });
      await service.registerListener(QueueName.Requests, listener, StubModel);

      await service.onApplicationShutdown();

      expect(mockConnectionClose).toHaveBeenCalled();
    });

    it('should log an error if a connection fails to close', async () => {
      await service.sendMessage(AddressName.Requests, { id: 1 });

      const closeError = new Error('mock close error');
      mockSendClose.mockRejectedValueOnce(closeError);
      await service.onApplicationShutdown();

      expect(logger.error).toHaveBeenCalled();
    });
  });
});
