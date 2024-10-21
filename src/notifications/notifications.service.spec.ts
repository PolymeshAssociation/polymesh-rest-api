/* eslint-disable import/first */
const mockLastValueFrom = jest.fn();

import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { TxTags } from '@polymeshassociation/polymesh-sdk/types';
import { when } from 'jest-when';

import { AppNotFoundError } from '~/common/errors';
import { TransactionType } from '~/common/types';
import { EventsService } from '~/events/events.service';
import { EventType } from '~/events/types';
import { mockPolymeshLoggerProvider } from '~/logger/mock-polymesh-logger';
import notificationsConfig from '~/notifications/config/notifications.config';
import { NotificationModel } from '~/notifications/model/notification.model';
import { NotificationsService } from '~/notifications/notifications.service';
import { NotificationRepo } from '~/notifications/repo/notifications.repo';
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let unsafeService: any;

  let mockScheduleService: MockScheduleService;
  let mockSubscriptionsService: MockSubscriptionsService;
  let mockEventsService: MockEventsService;
  let mockHttpService: MockHttpService;
  let notificationRepo: DeepMocked<NotificationRepo>;

  const maxTries = 5;
  const retryInterval = 5000;

  beforeEach(async () => {
    mockScheduleService = new MockScheduleService();
    mockSubscriptionsService = new MockSubscriptionsService();
    mockEventsService = new MockEventsService();
    mockHttpService = new MockHttpService();
    notificationRepo = createMock<NotificationRepo>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        ScheduleService,
        SubscriptionsService,
        EventsService,
        HttpService,
        mockPolymeshLoggerProvider,
        {
          provide: NotificationRepo,
          useValue: notificationRepo,
        },
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
    unsafeService = service;

    unsafeService.notifications = {
      1: new NotificationModel({
        id: 1,
        subscriptionId: 1,
        eventId: 1,
        triesLeft: maxTries,
        status: NotificationStatus.Acknowledged,
        createdAt: new Date('10/14/1987'),
        nonce: 0,
      }),
    };
    unsafeService.currentId = 1;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a notification by ID', async () => {
      const params = {
        id: 1,
        subscriptionId: 1,
        eventId: 1,
        triesLeft: maxTries,
        status: NotificationStatus.Acknowledged,
        createdAt: new Date('10/14/1987'),
        nonce: 0,
      };

      const model = new NotificationModel(params);

      when(notificationRepo.findById).calledWith(model.id).mockResolvedValue(model);

      const result = await service.findOne(1);

      expect(result).toEqual(model);
    });

    it('should throw an error if there is no notification with the passed ID', () => {
      notificationRepo.findById.mockResolvedValue(undefined);

      return expect(service.findOne(10)).rejects.toThrow(AppNotFoundError);
    });
  });

  describe('createNotifications', () => {
    it('should create a group of notifications, return their IDs, and schedule them to be sent, retrying if something goes wrong', async () => {
      const subscriptionId = 1;
      const params = {
        eventId: 2,
        subscriptionId,
        nonce: 0,
      };

      when(notificationRepo.create)
        .calledWith({ ...params, triesLeft: maxTries, status: NotificationStatus.Active })
        .mockResolvedValue(
          createMock<NotificationModel>({
            id: 2,
            ...params,
          })
        );

      const result = await service.createNotifications([params]);

      expect(result).toEqual([2]);

      const webhookUrl = 'https://www.example.com';
      const legitimacySecret = 'someSecret';
      const type = EventType.TransactionUpdate;
      const scope = '0x01';
      const payload = {
        type: TransactionType.Single,
        transactionTag: TxTags.asset.RegisterUniqueTicker,
      };
      const mockIsExpired = jest.fn();
      mockSubscriptionsService.findOne.mockReturnValue({
        webhookUrl,
        id: subscriptionId,
        isExpired: mockIsExpired,
        legitimacySecret,
      });
      mockEventsService.findOne.mockReturnValue({
        payload,
        type,
        scope,
        subscriptionId,
      });
      mockLastValueFrom.mockReturnValue({
        status: 200,
      });

      when(notificationRepo.findById)
        .calledWith(1)
        .mockResolvedValue(
          createMock<NotificationModel>({
            status: NotificationStatus.Active,
            triesLeft: maxTries,
          })
        );

      // notifications for expired subscriptions should be marked as orphaned
      mockIsExpired.mockReturnValue(true);
      await unsafeService.sendNotification(1);

      expect(notificationRepo.update).toHaveBeenCalledWith(1, {
        status: NotificationStatus.Orphaned,
      });
      expect(mockHttpService.post).not.toHaveBeenCalled();

      mockIsExpired.mockReturnValue(false);

      await unsafeService.sendNotification(2);

      expect(notificationRepo.update).toHaveBeenCalledWith(2, {
        status: NotificationStatus.Acknowledged,
      });

      await service.updateNotification(2, {
        status: NotificationStatus.Active,
      });

      mockLastValueFrom.mockReturnValue({
        status: 500,
      });

      when(notificationRepo.findById)
        .calledWith(2)
        .mockResolvedValueOnce(
          createMock<NotificationModel>({
            triesLeft: 2,
            status: NotificationStatus.Active,
          })
        );

      await unsafeService.sendNotification(2);

      expect(notificationRepo.update).toHaveBeenCalledWith(2, {
        status: NotificationStatus.Active,
      });

      expect(notificationRepo.update).toHaveBeenCalledWith(2, {
        triesLeft: 1,
      });

      when(notificationRepo.findById)
        .calledWith(2)
        .mockResolvedValueOnce(
          createMock<NotificationModel>({
            triesLeft: 1,
            status: NotificationStatus.Active,
          })
        );

      await unsafeService.sendNotification(2);

      expect(notificationRepo.update).toHaveBeenCalledWith(2, {
        status: NotificationStatus.Failed,
        triesLeft: 0,
      });
    });
  });

  describe('updateSubscription', () => {
    it('should update a notification and return it, ignoring fields other than status or triesLeft', async () => {
      const status = NotificationStatus.Active;
      const triesLeft = 1;
      const id = 1;

      const params = {
        status,
        triesLeft,
      };

      const notification = createMock<NotificationModel>({ id, ...params });

      when(notificationRepo.update).calledWith(id, params).mockResolvedValue(notification);

      const result = await service.updateNotification(id, params);

      expect(result.status).toBe(status);
      expect(result.triesLeft).toBe(triesLeft);
      expect(result.id).toBe(1);
    });
  });
});
