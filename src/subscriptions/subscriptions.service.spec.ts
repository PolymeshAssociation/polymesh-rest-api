/* eslint-disable import/first */
const mockLastValueFrom = jest.fn();

import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';

import { EventType } from '~/events/types';
import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import { ScheduleService } from '~/schedule/schedule.service';
import subscriptionsConfig from '~/subscriptions/config/subscriptions.config';
import { SubscriptionEntity } from '~/subscriptions/entities/subscription.entity';
import { HANDSHAKE_HEADER_KEY } from '~/subscriptions/subscriptions.consts';
import { SubscriptionsService } from '~/subscriptions/subscriptions.service';
import { SubscriptionStatus } from '~/subscriptions/types';
import { MockHttpService, MockScheduleService } from '~/test-utils/service-mocks';

jest.mock('rxjs', () => ({
  ...jest.requireActual('rxjs'),
  lastValueFrom: mockLastValueFrom,
}));

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;

  let mockScheduleService: MockScheduleService;
  let mockHttpService: MockHttpService;

  const ttl = 120000;
  const maxTries = 5;
  const retryInterval = 5000;

  const subs = [
    new SubscriptionEntity({
      id: 1,
      eventType: EventType.TransactionUpdate,
      eventScope: '0x01',
      webhookUrl: 'https://example.com/hook',
      createdAt: new Date('10/14/1987'),
      ttl,
      status: SubscriptionStatus.Done,
      triesLeft: maxTries,
    }),
    new SubscriptionEntity({
      id: 2,
      eventType: EventType.TransactionUpdate,
      eventScope: '0x02',
      webhookUrl: 'https://example.com/hook',
      createdAt: new Date('10/14/1987'),
      ttl,
      status: SubscriptionStatus.Rejected,
      triesLeft: maxTries,
    }),
  ];

  beforeEach(async () => {
    mockScheduleService = new MockScheduleService();
    mockHttpService = new MockHttpService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        ScheduleService,
        HttpService,
        mockPolymeshLoggerProvider,
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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('method: findAll', () => {
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

  describe('method: findOne', () => {
    it('should return a single subscription by ID', async () => {
      const result = await service.findOne(1);

      expect(result).toEqual(subs[0]);
    });

    it('should throw an error if there is no subscription with the passed id', () => {
      return expect(service.findOne(4)).rejects.toThrow('There is no subscription with ID "4"');
    });
  });

  describe('method: createSubscription', () => {
    it('should create a subscription and return its ID, and send a handshake to the webhook, retrying if it fails', async () => {
      const eventType = EventType.TransactionUpdate;
      const eventScope = '0x03';
      const webhookUrl = 'https://www.example.com';

      const result = await service.createSubscription({
        eventScope,
        eventType,
        webhookUrl,
      });

      expect(result).toEqual(3);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { createdAt: _, ...sub } = await service.findOne(3);

      expect(sub).toEqual({
        id: 3,
        ttl,
        triesLeft: maxTries,
        status: SubscriptionStatus.Inactive,
        eventType,
        eventScope,
        webhookUrl,
      });

      // ignore expired subs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (service as any).sendHandshake(1);

      expect(mockHttpService.post).not.toHaveBeenCalled();

      mockLastValueFrom.mockResolvedValue({
        status: 200,
        headers: {
          [HANDSHAKE_HEADER_KEY]: 'placeholderHandshake:3',
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (service as any).sendHandshake(3);

      let subscription = await service.findOne(3);
      expect(subscription.status).toBe(SubscriptionStatus.Active);

      mockLastValueFrom.mockResolvedValue({
        status: 500,
      });

      await service.updateSubscription(3, {
        status: SubscriptionStatus.Inactive,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (service as any).sendHandshake(3);

      subscription = await service.findOne(3);
      expect(subscription.status).toBe(SubscriptionStatus.Inactive);

      await service.updateSubscription(3, {
        status: SubscriptionStatus.Inactive,
        triesLeft: 1,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (service as any).sendHandshake(3);

      subscription = await service.findOne(3);
      expect(subscription.status).toBe(SubscriptionStatus.Rejected);
    });
  });

  describe('method: updateSubscription', () => {
    it('should update a subscription and return it, ignoring fields other than status or triesLeft', async () => {
      const status = SubscriptionStatus.Active;
      const triesLeft = 1;
      const result = await service.updateSubscription(1, {
        status,
        triesLeft,
        id: 4,
      });

      expect(result.status).toBe(status);
      expect(result.triesLeft).toBe(triesLeft);
      expect(result.id).toBe(1);
    });
  });

  describe('method: batchMarkAsDone', () => {
    it('should mark a group of subscriptions as done', async () => {
      await service.batchMarkAsDone([1, 2]);

      const result = await service.findAll({ status: SubscriptionStatus.Done });

      expect(result.length).toBe(2);
    });
  });
});
