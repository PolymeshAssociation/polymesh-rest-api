import { HttpService } from '@nestjs/axios';
import { forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { lastValueFrom } from 'rxjs';

import { AppNotFoundError } from '~/common/errors';
import { EventsService } from '~/events/events.service';
import { EventType, GetPayload } from '~/events/types';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import notificationsConfig from '~/notifications/config/notifications.config';
import { NotificationModel } from '~/notifications/model/notification.model';
import { SIGNATURE_HEADER_KEY } from '~/notifications/notifications.consts';
import { signPayload } from '~/notifications/notifications.util';
import { NotificationRepo } from '~/notifications/repo/notifications.repo';
import { NotificationParams, NotificationPayload, NotificationStatus } from '~/notifications/types';
import { ScheduleService } from '~/schedule/schedule.service';
import { SubscriptionsService } from '~/subscriptions/subscriptions.service';

@Injectable()
export class NotificationsService {
  private maxTries: number;
  private retryInterval: number;

  constructor(
    @Inject(notificationsConfig.KEY) config: ConfigType<typeof notificationsConfig>,
    private readonly scheduleService: ScheduleService,
    private readonly subscriptionsService: SubscriptionsService,
    @Inject(forwardRef(() => EventsService)) private readonly eventsService: EventsService,
    private readonly httpService: HttpService,
    private readonly logger: PolymeshLogger,
    private readonly notificationsRepo: NotificationRepo
  ) {
    const { maxTries, retryInterval } = config;

    this.maxTries = maxTries;
    this.retryInterval = retryInterval;

    logger.setContext(NotificationsService.name);
  }

  public async findOne(id: number): Promise<NotificationModel> {
    const notification = await this.notificationsRepo.findById(id);

    if (!notification) {
      throw new AppNotFoundError(id.toString(), 'notification');
    }

    return notification;
  }

  public async createNotifications(
    newNotifications: Pick<NotificationModel, 'eventId' | 'subscriptionId' | 'nonce'>[]
  ): Promise<number[]> {
    const { maxTries: triesLeft } = this;

    const newIds: number[] = [];
    await Promise.all(
      newNotifications.map(async notification => {
        const { id } = await this.notificationsRepo.create({
          ...notification,
          triesLeft,
          status: NotificationStatus.Active,
        });

        newIds.push(id);

        /**
         * we add the notification to the scheduler cycle
         */
        this.scheduleSendNotification(id, 0);
      })
    );

    return newIds;
  }

  public async updateNotification(
    id: number,
    data: Partial<NotificationParams>
  ): Promise<NotificationModel> {
    return this.notificationsRepo.update(id, data);
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
    const { subscriptionId, eventId, triesLeft, nonce } = notification;

    try {
      const [subscription, { payload, type, scope }] = await Promise.all([
        subscriptionsService.findOne(subscriptionId),
        eventsService.findOne(eventId),
      ]);

      const { webhookUrl, legitimacySecret } = subscription;

      if (subscription.isExpired()) {
        await this.updateNotification(id, {
          status: NotificationStatus.Orphaned,
        });

        return;
      }

      const notificationPayload = this.assembleNotificationPayload(
        subscriptionId,
        type,
        scope,
        payload,
        nonce
      );
      const signature = signPayload(notificationPayload, legitimacySecret);
      const response = await lastValueFrom(
        this.httpService.post(webhookUrl, notificationPayload, {
          headers: {
            [SIGNATURE_HEADER_KEY]: signature,
          },
          timeout: 10000,
        })
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
    payload: GetPayload<T>,
    nonce: number
  ): NotificationPayload<T> {
    return {
      type,
      scope,
      subscriptionId,
      payload,
      nonce,
    };
  }

  /**
   * Mark the notification as acknowledged if the response status is OK. Otherwise, throw an error
   *
   * @param id - notification IID
   */
  private async handleWebhookResponse(id: number, response: AxiosResponse): Promise<void> {
    const { status } = response;
    if (status === HttpStatus.OK) {
      await this.updateNotification(id, {
        status: NotificationStatus.Acknowledged,
      });

      return;
    }

    throw new Error(`Webhook responded with non-OK status: ${status}`);
  }

  /**
   * Reschedule a notification to be sent later
   *
   * @param id - notification ID
   * @param triesLeft - amount of retries left for the notification. If none are left,
   *   the notification is marked as "timed out" and no retry is scheduled
   */
  private async retry(id: number, triesLeft: number): Promise<void> {
    if (triesLeft === 0) {
      await this.updateNotification(id, {
        triesLeft,
        status: NotificationStatus.Failed,
      });

      return;
    }

    await this.updateNotification(id, {
      triesLeft,
    });

    this.scheduleSendNotification(id);
  }
}
