import { HttpService } from '@nestjs/axios';
import { HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { filter, pick } from 'lodash';
import { lastValueFrom } from 'rxjs';

import { EventType } from '~/events/types';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { ScheduleService } from '~/schedule/schedule.service';
import subscriptionsConfig from '~/subscriptions/config/subscriptions.config';
import { SubscriptionEntity } from '~/subscriptions/entities/subscription.entity';
import { HANDSHAKE_HEADER_KEY } from '~/subscriptions/subscriptions.consts';
import { SubscriptionStatus } from '~/subscriptions/types';

@Injectable()
export class SubscriptionsService {
  private subscriptions: Record<number, SubscriptionEntity>;
  private currentId: number;

  private ttl: number;
  private maxTries: number;
  private retryInterval: number;

  constructor(
    @Inject(subscriptionsConfig.KEY) config: ConfigType<typeof subscriptionsConfig>,
    private readonly scheduleService: ScheduleService,
    private readonly httpService: HttpService,
    // TODO @monitz87: handle errors with specialized service
    private readonly logger: PolymeshLogger
  ) {
    const { ttl, maxTries: triesLeft, retryInterval } = config;

    this.ttl = ttl;
    this.maxTries = triesLeft;
    this.retryInterval = retryInterval;

    this.subscriptions = {
      1: new SubscriptionEntity({
        id: 1,
        eventType: EventType.TransactionUpdate,
        eventScope: '0x01',
        webhookUrl: 'https://example.com/hook',
        createdAt: new Date('10/14/1987'),
        ttl,
        status: SubscriptionStatus.Done,
        triesLeft,
      }),
      2: new SubscriptionEntity({
        id: 2,
        eventType: EventType.TransactionUpdate,
        eventScope: '0x02',
        webhookUrl: 'https://example.com/hook',
        createdAt: new Date('10/14/1987'),
        ttl,
        status: SubscriptionStatus.Rejected,
        triesLeft,
      }),
    };
    this.currentId = 2;

    logger.setContext(SubscriptionsService.name);
  }

  /**
   * Fetch all subscriptions. Allows filtering by different parameters and excluding
   *   expired subscriptions from the result (default behavior is to include them)
   */
  public async findAll(
    filters: Partial<Pick<SubscriptionEntity, 'eventType' | 'eventScope' | 'status'>> & {
      excludeExpired?: boolean;
    } = {}
  ): Promise<SubscriptionEntity[]> {
    const {
      status: statusFilter,
      eventScope: scopeFilter,
      eventType: typeFilter,
      excludeExpired = false,
    } = filters;

    return filter(this.subscriptions, subscription => {
      const { status, eventScope, eventType } = subscription;

      return (
        (!statusFilter || statusFilter === status) &&
        (!scopeFilter || scopeFilter === eventScope) &&
        (!typeFilter || typeFilter === eventType) &&
        (!excludeExpired || !subscription.isExpired())
      );
    });
  }

  public async findOne(id: number): Promise<SubscriptionEntity> {
    const sub = this.subscriptions[id];

    if (!sub) {
      throw new NotFoundException(`There is no subscription with ID "${id}"`);
    }

    return sub;
  }

  public async createSubscription(
    sub: Pick<SubscriptionEntity, 'eventType' | 'eventScope' | 'webhookUrl'>
  ): Promise<number> {
    const { subscriptions, ttl, maxTries: triesLeft } = this;

    this.currentId += 1;
    const id = this.currentId;

    subscriptions[id] = new SubscriptionEntity({
      id,
      ...sub,
      createdAt: new Date(),
      status: SubscriptionStatus.Inactive,
      ttl,
      triesLeft,
    });

    /**
     * we add the subscription handshake to the scheduler cycle
     */
    this.scheduleSendHandshake(id, 0);

    return id;
  }

  /**
   * @note ignores any properties other than `status` and `triesLeft`
   */
  public async updateSubscription(
    id: number,
    data: Partial<SubscriptionEntity>
  ): Promise<SubscriptionEntity> {
    const { subscriptions } = this;

    const updater = pick(data, 'status', 'triesLeft');

    const current = await this.findOne(id);

    const updated = new SubscriptionEntity({
      ...current,
      ...updater,
    });

    subscriptions[id] = updated;

    return updated;
  }

  /**
   * Change the status of many subscriptions at once to "done"
   */
  public async batchMarkAsDone(ids: number[]): Promise<void> {
    const { subscriptions } = this;

    ids.forEach(id => {
      subscriptions[id].status = SubscriptionStatus.Done;
    });
  }

  /**
   * Schedule a subscription handshake to be sent after a certain time has elapsed
   *
   * @param id - subscription ID
   * @param ms - amount of milliseconds to wait before sending the handshake
   */
  private scheduleSendHandshake(id: number, ms: number = this.retryInterval): void {
    this.scheduleService.addTimeout(
      this.getTimeoutId(id),
      /* istanbul ignore next */
      () => this.sendHandshake(id),
      ms
    );
  }

  /**
   * Generate an identifier for a "send handshake" scheduled task. This is used
   *   to track scheduled timeouts internally
   *
   * @param id - subscription ID
   */
  private getTimeoutId(id: number): string {
    return `sendSubscriptionHandshake_${id}`;
  }

  /**
   * Attempt to send a handshake request to the subscription URL. The response must have a status
   *   of 200 and contain the handshake secret in the headers. Otherwise, we schedule a retry
   *
   * @param id - subscription ID
   */
  private async sendHandshake(id: number) {
    const subscription = await this.findOne(id);

    if (subscription.isExpired()) {
      return;
    }

    const { webhookUrl, triesLeft } = subscription;
    const { httpService, logger } = this;

    try {
      const secret = this.generateHandshakeSecret(id);

      const response = await lastValueFrom(
        httpService.post(
          webhookUrl,
          {},
          {
            headers: {
              [HANDSHAKE_HEADER_KEY]: secret,
            },
            timeout: 10000,
          }
        )
      );

      await this.handleHandshakeResponse(id, response, secret);
    } catch (err) {
      logger.error(`Error while sending handshake for subscription "${id}":`, err);

      await this.retry(id, triesLeft - 1);
    }
  }

  /**
   * Mark the subscription as active if the response status is OK and contains the handshake secret in the
   *   headers. Otherwise, throw an error
   *
   * @param id - subscription ID
   */
  private async handleHandshakeResponse(
    id: number,
    response: AxiosResponse,
    secret: string
  ): Promise<void> {
    const { status, headers } = response;

    if (status === HttpStatus.OK && headers[HANDSHAKE_HEADER_KEY] === secret) {
      await this.updateSubscription(id, {
        status: SubscriptionStatus.Active,
      });

      return;
    }

    throw new Error('Webhook did not respond with expected handshake');
  }

  /**
   * Reschedule a subscription handshake to be sent later
   *
   * @param id - subscription ID
   * @param triesLeft - amount of retries left for the subscription. If none are left,
   *   the subscription is marked as "rejected" and no retry is scheduled
   */
  private async retry(id: number, triesLeft: number) {
    if (triesLeft === 0) {
      await this.updateSubscription(id, {
        triesLeft,
        status: SubscriptionStatus.Rejected,
      });

      return;
    }

    await this.updateSubscription(id, {
      triesLeft,
    });

    this.scheduleSendHandshake(id);
  }

  // TODO @monitz87: implement random secret generation
  /**
   * Generate a random handshake secret that the webhook has to mirror back
   *   to activate the subscription
   *
   * @param id - subscription ID
   */
  private generateHandshakeSecret(id: number): string {
    return `placeholderHandshake:${id}`;
  }
}