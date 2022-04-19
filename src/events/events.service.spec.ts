import { Test, TestingModule } from '@nestjs/testing';
import { TransactionStatus, TxTags } from '@polymathnetwork/polymesh-sdk/types';

import { TransactionType } from '~/common/types';
import { EventEntity } from '~/events/entities/event.entity';
import { EventsService } from '~/events/events.service';
import { EventType, TransactionUpdatePayload } from '~/events/types';
import { NotificationsService } from '~/notifications/notifications.service';
import { SubscriptionsService } from '~/subscriptions/subscriptions.service';
import { MockNotificationsService, MockSubscriptionsService } from '~/test-utils/service-mocks';

describe('EventsService', () => {
  let service: EventsService;

  let mockNotificationsService: MockNotificationsService;
  let mockSubscriptionsService: MockSubscriptionsService;

  beforeEach(async () => {
    mockNotificationsService = new MockNotificationsService();
    mockSubscriptionsService = new MockSubscriptionsService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [EventsService, SubscriptionsService, NotificationsService],
    })
      .overrideProvider(NotificationsService)
      .useValue(mockNotificationsService)
      .overrideProvider(SubscriptionsService)
      .useValue(mockSubscriptionsService)
      .compile();

    service = module.get<EventsService>(EventsService);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unsafeService: any = service;
    unsafeService.events = {
      1: new EventEntity<TransactionUpdatePayload>({
        scope: '0x01',
        type: EventType.TransactionUpdate,
        processed: true,
        id: 1,
        createdAt: new Date('10/14/1987'),
        payload: {
          type: TransactionType.Single,
          transactionTag: TxTags.asset.RegisterTicker,
          status: TransactionStatus.Unapproved,
        },
      }),
    };
    unsafeService.currentId = 1;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('method: createEvent', () => {
    it('should create an event and its associated notifications, and return the new event ID', async () => {
      const type = EventType.TransactionUpdate;
      const scope = '0x02';
      const payload = {
        type: TransactionType.Single,
        transactionTag: TxTags.asset.CreateAsset,
        status: TransactionStatus.Unapproved,
      } as const;

      mockSubscriptionsService.findAll.mockReturnValue([
        {
          id: 1,
        },
      ]);

      const result = await service.createEvent({
        type,
        scope,
        payload,
      });

      expect(result).toBe(2);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { createdAt, ...event } = await service.findOne(2);

      expect(event).toEqual({
        type,
        scope,
        payload,
        id: 2,
        processed: true,
      });
      expect(mockNotificationsService.createNotifications).toHaveBeenCalledWith([
        {
          subscriptionId: 1,
          eventId: 2,
        },
      ]);
    });
  });

  describe('method: findOne', () => {
    it('should return an event by ID', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { createdAt, ...result } = await service.findOne(1);

      expect(result).toEqual({
        id: 1,
        type: EventType.TransactionUpdate,
        scope: '0x01',
        processed: true,
        payload: {
          type: TransactionType.Single,
          transactionTag: TxTags.asset.RegisterTicker,
          status: TransactionStatus.Unapproved,
        },
      });
    });

    it('should throw an error if the event does not exist', () => {
      return expect(service.findOne(10)).rejects.toThrow('There is no event with ID "10"');
    });
  });
});
