/* eslint-disable import/first */
const mockLastValueFrom = jest.fn();

import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { TxTags } from '@polymathnetwork/polymesh-sdk/types';

import { TransactionType } from '~/common/types';
import { EventsService } from '~/events/events.service';
import { EventType } from '~/events/types';
import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import notificationsConfig from '~/notifications/config/notifications.config';
import { NotificationEntity } from '~/notifications/entities/notification.entity';
import { NotificationsService } from '~/notifications/notifications.service';
import { NotificationStatus } from '~/notifications/types';
import { ScheduleService } from '~/schedule/schedule.service';
import { SubscriptionsService } from '~/subscriptions/subscriptions.service';
import {
  MockEventsService,
  MockHttpService,
  MockScheduleService,
  MockSubscriptionsService,
} from '~/test-utils/service-mocks';

jest.mock('rxjs', () => ({
  ...jest.requireActual('rxjs'),
  lastValueFrom: mockLastValueFrom,
}));

describe('NotificationsService', () => {
  let service: NotificationsService;

  let mockScheduleService: MockScheduleService;
  let mockSubscriptionsService: MockSubscriptionsService;
  let mockEventsService: MockEventsService;
  let mockHttpService: MockHttpService;

  const maxTries = 5;
  const retryInterval = 5000;

  beforeEach(async () => {
    mockScheduleService = new MockScheduleService();
    mockSubscriptionsService = new MockSubscriptionsService();
    mockEventsService = new MockEventsService();
    mockHttpService = new MockHttpService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        ScheduleService,
        SubscriptionsService,
        EventsService,
        HttpService,
        mockPolymeshLoggerProvider,
        {
          provide: notificationsConfig.KEY,
          useValue: { maxTries, retryInterval },
        },
      ],
    })
      .overrideProvider(ScheduleService)
      .useValue(mockScheduleService)
      .overrideProvider(SubscriptionsService)
      .useValue(mockSubscriptionsService)
      .overrideProvider(EventsService)
      .useValue(mockEventsService)
      .overrideProvider(HttpService)
      .useValue(mockHttpService)
      .compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('method: findOne', () => {
    it('should return a notification by ID', async () => {
      const result = await service.findOne(1);

      expect(result).toEqual(
        new NotificationEntity({
          id: 1,
          subscriptionId: 1,
          eventId: 1,
          triesLeft: maxTries,
          status: NotificationStatus.Acknowledged,
          createdAt: new Date('10/14/1987'),
        })
      );
    });

    it('should throw an error if there is no notification with the passed ID', () => {
      return expect(service.findOne(10)).rejects.toThrow('There is no notification with ID "10"');
    });
  });

  describe('method: createNotifications', () => {
    it('should create a group of notifications, return their IDs, and schedule them to be sent, retrying if something goes wrong', async () => {
      const subscriptionId = 1;
      const result = await service.createNotifications([
        {
          eventId: 2,
          subscriptionId,
        },
      ]);

      expect(result).toEqual([2]);

      const webhookUrl = 'https://www.example.com';
      const type = EventType.TransactionUpdate;
      const payload = {
        type: TransactionType.Single,
        transactionTag: TxTags.asset.RegisterTicker,
      };
      const mockIsExpired = jest.fn();
      mockSubscriptionsService.findOne.mockReturnValue({
        webhookUrl,
        id: subscriptionId,
        isExpired: mockIsExpired,
      });
      mockEventsService.findOne.mockReturnValue({
        payload,
        type,
        subscriptionId,
      });
      mockLastValueFrom.mockReturnValue({
        status: 200,
      });

      // notifications for expired subscriptions should be marked as orphaned
      mockIsExpired.mockReturnValue(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (service as any).sendNotification(1);

      let notification = await service.findOne(1);

      expect(notification.status).toBe(NotificationStatus.Orphaned);
      expect(mockHttpService.post).not.toHaveBeenCalled();

      mockIsExpired.mockReturnValue(false);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (service as any).sendNotification(2);

      notification = await service.findOne(2);

      expect(notification.status).toBe(NotificationStatus.Acknowledged);

      await service.updateNotification(2, {
        status: NotificationStatus.Active,
      });

      mockLastValueFrom.mockReturnValue({
        status: 500,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (service as any).sendNotification(2);

      notification = await service.findOne(2);

      expect(notification.triesLeft).toBe(maxTries - 1);
      expect(notification.status).toBe(NotificationStatus.Active);

      await service.updateNotification(2, {
        triesLeft: 1,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (service as any).sendNotification(2);

      notification = await service.findOne(2);

      expect(notification.status).toBe(NotificationStatus.TimedOut);
    });
  });

  describe('method: updateSubscription', () => {
    it('should update a notification and return it, ignoring fields other than status or triesLeft', async () => {
      const status = NotificationStatus.Active;
      const triesLeft = 1;
      const result = await service.updateNotification(1, {
        status,
        triesLeft,
        id: 4,
      });

      expect(result.status).toBe(status);
      expect(result.triesLeft).toBe(triesLeft);
      expect(result.id).toBe(1);
    });
  });
});