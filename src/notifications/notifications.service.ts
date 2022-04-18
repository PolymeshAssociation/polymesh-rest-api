import { HttpService } from '@nestjs/axios';
import { forwardRef, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { pick } from 'lodash';
import { lastValueFrom } from 'rxjs';

import { EventsService } from '~/events/events.service';
import { EventPayload, EventType, GetPayload } from '~/events/types';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import notificationsConfig from '~/notifications/config/notifications.config';
import { NotificationEntity } from '~/notifications/entities/notification.entity';
import { SIGNATURE_HEADER_KEY } from '~/notifications/notifications.consts';
import { NotificationPayload, NotificationStatus } from '~/notifications/types';
import { ScheduleService } from '~/schedule/schedule.service';
import { SubscriptionsService } from '~/subscriptions/subscriptions.service';

@Injectable()
export class NotificationsService {
  private notifications: Record<number, NotificationEntity>;
  private currentId: number;

  private maxTries: number;
  private retryInterval: number;

  constructor(
    @Inject(notificationsConfig.KEY) config: ConfigType<typeof notificationsConfig>,
    private readonly scheduleService: ScheduleService,
    private readonly subscriptionsService: SubscriptionsService,
    @Inject(forwardRef(() => EventsService)) private readonly eventsService: EventsService,
    private readonly httpService: HttpService,
    // TODO @monitz87: handle errors with specialized service
    private readonly logger: PolymeshLogger
  ) {
    const { maxTries, retryInterval } = config;

    this.maxTries = maxTries;
    this.retryInterval = retryInterval;

    this.notifications = {
      1: new NotificationEntity({
        id: 1,
        subscriptionId: 1,
        eventId: 1,
        triesLeft: maxTries,
        status: NotificationStatus.Acknowledged,
        createdAt: new Date('10/14/1987'),
      }),
    };
    this.currentId = 1;

    logger.setContext(NotificationsService.name);
  }

  public async findOne(id: number): Promise<NotificationEntity> {
    const notification = this.notifications[id];

    if (!notification) {
      throw new NotFoundException(`There is no notification with ID "${id}"`);
    }

    return notification;
  }

  public async createNotifications(
    newNotifications: Pick<NotificationEntity, 'eventId' | 'subscriptionId'>[]
  ): Promise<number[]> {
    const { notifications, maxTries: triesLeft } = this;
    const newIds: number[] = [];

    newNotifications.forEach(notification => {
      this.currentId += 1; // auto-increment
      const id = this.currentId;

      newIds.push(id);
      notifications[id] = new NotificationEntity({
        id,
        ...notification,
        triesLeft,
        status: NotificationStatus.Active,
        createdAt: new Date(),
      });

      /**
       * we add the notification to the scheduler cycle
       */
      this.scheduleSendNotification(id, 0);
    });

    return newIds;
  }

  /**
   * @note ignores any properties other than `status` and `triesLeft`
   */
  public async updateNotification(
    id: number,
    data: Partial<NotificationEntity>
  ): Promise<NotificationEntity> {
    const { notifications } = this;

    const updater = pick(data, 'status', 'triesLeft');

    const current = await this.findOne(id);

    const updated = new NotificationEntity({
      ...current,
      ...updater,
    });

    notifications[id] = updated;

    return updated;
  }

  /**
   * Schedule a notification to be sent after a certain time has elapsed
   *
   * @param id - notification ID
   * @param ms - amount of milliseconds to wait before sending the notification
   */
  private scheduleSendNotification(id: number, ms: number = this.retryInterval): void {
    this.scheduleService.addTimeout(
      this.getTimeoutId(id),
      /* istanbul ignore next */
      () => this.sendNotification(id),
      ms
    );
  }

  /**
   * Generate an identifier for a "send notification" scheduled task. This is used
   *   to track scheduled timeouts internally
   *
   * @param id - notification ID
   */
  private getTimeoutId(id: number): string {
    return `sendNotification_${id}`;
  }

  /**
   * Attempt to send a notification to the corresponding subscription URL. Any response other than
   *   200 will cause a retry to be scheduled
   */
  private async sendNotification(id: number): Promise<void> {
    const notification = await this.findOne(id);

    const { subscriptionsService, eventsService, logger } = this;
    const { subscriptionId, eventId, triesLeft } = notification;

    try {
      const [subscription, { payload, type, scope }] = await Promise.all([
        subscriptionsService.findOne(subscriptionId),
        eventsService.findOne(eventId),
      ]);

      const { webhookUrl } = subscription;

      if (subscription.isExpired()) {
        await this.updateNotification(id, {
          status: NotificationStatus.Orphaned,
        });

        return;
      }

      const signature = this.signPayload(payload);
      const response = await lastValueFrom(
        this.httpService.post(
          webhookUrl,
          this.assembleNotificationPayload(subscriptionId, type, scope, payload),
          {
            headers: {
              [SIGNATURE_HEADER_KEY]: signature,
            },
            timeout: 10000,
          }
        )
      );

      await this.handleWebhookResponse(id, response);
    } catch (err) {
      logger.error(`Error while sending notification "${id}":`, err);

      await this.retry(id, triesLeft - 1);
    }
  }

  private assembleNotificationPayload<T extends EventType>(
    subscriptionId: number,
    type: T,
    scope: string,
    payload: GetPayload<T>
  ): NotificationPayload<T> {
    return {
      type,
      scope,
      subscriptionId,
      payload,
    };
  }

  /**
   * Mark the notification as acknowledged if the response status is OK. Otherwise, throw an error
   *
   * @param id - notification IID
   */
  private async handleWebhookResponse(id: number, response: AxiosResponse) {
    if (response.status === HttpStatus.OK) {
      await this.updateNotification(id, {
        status: NotificationStatus.Acknowledged,
      });

      return;
    }

    throw new Error('Webhook responded with non-OK status');
  }

  /**
   * Reschedule a notification to be sent later
   *
   * @param id - notification ID
   * @param triesLeft - amount of retries left for the notification. If none are left,
   *   the notification is marked as "timed out" and no retry is scheduled
   */
  private async retry(id: number, triesLeft: number) {
    if (triesLeft === 0) {
      await this.updateNotification(id, {
        triesLeft,
        status: NotificationStatus.TimedOut,
      });

      return;
    }

    await this.updateNotification(id, {
      triesLeft,
    });

    this.scheduleSendNotification(id);
  }

  // TODO @monitz87: implement HMAC signature (will have to include the secret somehow)
  /**
   * Compute a signature of the payload for legitimacy validation
   */
  private signPayload(payload: EventPayload): string {
    return `placeholderSignature:${JSON.stringify(payload)}`;
  }
}
