/* eslint-disable import/first */
const mockLastValueFrom = jest.fn();
const mockRandomBytes = jest.fn();

import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { when } from 'jest-when';

import { AppNotFoundError } from '~/common/errors';
import { EventType } from '~/events/types';
import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { ScheduleService } from '~/schedule/schedule.service';
import subscriptionsConfig from '~/subscriptions/config/subscriptions.config';
import { SubscriptionModel } from '~/subscriptions/models/subscription.model';
import { SubscriptionRepo } from '~/subscriptions/repo/subscription.repo';
import { HANDSHAKE_HEADER_KEY } from '~/subscriptions/subscriptions.consts';
import { SubscriptionsService } from '~/subscriptions/subscriptions.service';
import { SubscriptionStatus } from '~/subscriptions/types';
import { MockHttpService, MockScheduleService } from '~/test-utils/service-mocks';

jest.mock('rxjs', () => ({
  ...jest.requireActual('rxjs'),
  lastValueFrom: mockLastValueFrom,
}));
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: mockRandomBytes,
}));

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let unsafeService: any;

  let mockScheduleService: MockScheduleService;
  let mockHttpService: MockHttpService;
  let mockSubscriptionRepo: DeepMocked<SubscriptionRepo>;

  const ttl = 120000;
  const maxTries = 5;
  const retryInterval = 5000;
  const legitimacySecret = 'someSecret';

  const subs = [
    new SubscriptionModel({
      id: 1,
      eventType: EventType.TransactionUpdate,
      eventScope: '0x01',
      webhookUrl: 'https://example.com/hook',
      createdAt: new Date('10/14/1987'),
      ttl,
      status: SubscriptionStatus.Done,
      triesLeft: maxTries,
      nextNonce: 0,
      legitimacySecret,
    }),
    new SubscriptionModel({
      id: 2,
      eventType: EventType.TransactionUpdate,
      eventScope: '0x02',
      webhookUrl: 'https://example.com/hook',
      createdAt: new Date('10/14/1987'),
      ttl,
      status: SubscriptionStatus.Rejected,
      triesLeft: maxTries,
      nextNonce: 0,
      legitimacySecret,
    }),
  ];

  beforeEach(async () => {
    mockScheduleService = new MockScheduleService();
    mockHttpService = new MockHttpService();
    mockSubscriptionRepo = createMock<SubscriptionRepo>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        ScheduleService,
        HttpService,
        mockPolymeshLoggerProvider,
        {
          provide: SubscriptionRepo,
          useValue: mockSubscriptionRepo,
        },
        {
          provide: subscriptionsConfig.KEY,
          useValue: { ttl, maxTries, retryInterval },
        },
      ],
    })
      .overrideProvider(ScheduleService)
      .useValue(mockScheduleService)
      .overrideProvider(HttpService)
      .useValue(mockHttpService)
      .compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);

    unsafeService = service;
    unsafeService.subscriptions = {
      1: subs[0],
      2: subs[1],
    };
    unsafeService.currentId = 2;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    beforeEach(() => {
      mockSubscriptionRepo.findAll.mockResolvedValue(subs);
    });

    it('should return all subscriptions', async () => {
      const result = await service.findAll();

      expect(result).toEqual(subs);
    });

    it('should filter results', async () => {
      let result = await service.findAll({
        status: SubscriptionStatus.Done,
      });

      expect(result).toEqual([subs[0]]);

      result = await service.findAll({
        eventScope: '0x02',
      });

      expect(result).toEqual([subs[1]]);

      result = await service.findAll({
        eventType: EventType.TransactionUpdate,
      });

      expect(result).toEqual(subs);

      result = await service.findAll({
        excludeExpired: true,
      });

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single subscription by ID', async () => {
      when(mockSubscriptionRepo.findById).calledWith(1).mockResolvedValue(subs[0]);

      const result = await service.findOne(1);

      expect(result).toEqual(subs[0]);
    });

    it('should throw an error if there is no subscription with the passed id', () => {
      when(mockSubscriptionRepo.findById).calledWith(4).mockResolvedValue(undefined);

      return expect(service.findOne(4)).rejects.toThrow(AppNotFoundError);
    });
  });

  describe('createSubscription', () => {
    it('should create a subscription and return its ID, and send a handshake to the webhook, retrying if it fails', async () => {
      const eventType = EventType.TransactionUpdate;
      const eventScope = '0x03';
      const webhookUrl = 'https://www.example.com';

      const mockSubscription = createMock<SubscriptionModel>({
        id: 3,
        triesLeft: 2,
        isExpired: () => false,
      });
      mockSubscriptionRepo.create.mockResolvedValue(mockSubscription);
      when(mockSubscriptionRepo.findById)
        .calledWith(mockSubscription.id)
        .mockResolvedValue(mockSubscription);

      const result = await service.createSubscription({
        eventScope,
        eventType,
        webhookUrl,
        legitimacySecret,
      });

      expect(result).toEqual(3);

      expect(mockSubscriptionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: SubscriptionStatus.Inactive })
      );

      // ignore expired subs
      await unsafeService.sendHandshake(1);

      expect(mockHttpService.post).not.toHaveBeenCalled();

      const handshakeSecret = 'cGxhY2Vob2xkZXI=';
      mockRandomBytes.mockImplementation((_length, callback) => {
        callback(undefined, Buffer.from(handshakeSecret, 'base64'));
      });
      mockLastValueFrom.mockResolvedValue({
        status: 200,
        headers: {
          [HANDSHAKE_HEADER_KEY]: handshakeSecret,
        },
      });

      await unsafeService.sendHandshake(3);

      expect(mockSubscriptionRepo.update).toHaveBeenCalledWith(
        3,
        expect.objectContaining({ status: SubscriptionStatus.Active })
      );

      mockLastValueFrom.mockResolvedValue({
        status: 500,
      });

      await unsafeService.sendHandshake(3);

      expect(mockSubscriptionRepo.update).toHaveBeenCalledWith(
        3,
        expect.objectContaining({ triesLeft: 1 })
      );

      expect(mockSubscriptionRepo.update).toHaveBeenCalledWith(
        3,
        expect.objectContaining({ status: SubscriptionStatus.Active })
      );

      const oneMoreTry = createMock<SubscriptionModel>({
        id: 4,
        triesLeft: 1,
        isExpired: () => false,
      });

      when(mockSubscriptionRepo.findById).calledWith(4).mockResolvedValue(oneMoreTry);

      await unsafeService.sendHandshake(4);

      expect(mockSubscriptionRepo.update).toHaveBeenCalledWith(
        4,
        expect.objectContaining({ triesLeft: 0, status: SubscriptionStatus.Rejected })
      );
    });
  });

  describe('updateSubscription', () => {
    it('should update a subscription and return it, ignoring fields other than status or triesLeft', async () => {
      const status = SubscriptionStatus.Active;
      const triesLeft = 1;

      const params = {
        status,
        triesLeft,
        id: 4,
      };

      when(mockSubscriptionRepo.update)
        .calledWith(1, params)
        .mockResolvedValue(
          createMock<SubscriptionModel>({
            id: 1,
            status,
            triesLeft,
          })
        );

      const result = await service.updateSubscription(1, params);

      expect(result.status).toBe(status);
      expect(result.triesLeft).toBe(triesLeft);
      expect(result.id).toBe(1);
    });
  });

  describe('batchMarkAsDone', () => {
    it('should mark a group of subscriptions as done', async () => {
      await service.batchMarkAsDone([1, 2]);

      expect(mockSubscriptionRepo.update).toHaveBeenCalledWith(1, {
        status: SubscriptionStatus.Done,
      });
      expect(mockSubscriptionRepo.update).toHaveBeenCalledWith(2, {
        status: SubscriptionStatus.Done,
      });
    });
  });

  describe('batchBumpNonce', () => {
    it('should mark a group of subscriptions as done', async () => {
      await service.batchBumpNonce([1, 2]);

      const result = await service.findAll();

      expect(result.every(({ nextNonce }) => nextNonce === 1));
    });
  });
});
