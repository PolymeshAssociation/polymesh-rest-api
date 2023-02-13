import { HttpService } from '@nestjs/axios';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { filter, pick } from 'lodash';
import { lastValueFrom } from 'rxjs';

import { AppNotFoundError } from '~/common/errors';
import { generateBase64Secret } from '~/common/utils';
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
    // TODO @polymath-eric: handle errors with specialized service
    private readonly logger: PolymeshLogger
  ) {
    const { ttl, maxTries: triesLeft, retryInterval } = config;

    this.ttl = ttl;
    this.maxTries = triesLeft;
    this.retryInterval = retryInterval;

    this.subscriptions = {};
    this.currentId = 0;

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
      throw new AppNotFoundError('subscription', id.toString());
    }

    return sub;
  }

  public async createSubscription(
    sub: Pick<SubscriptionEntity, 'eventType' | 'eventScope' | 'webhookUrl' | 'legitimacySecret'>
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
      nextNonce: 0,
    });

    /**
     * we add the subscription handshake to the scheduler cycle
     */
    this.scheduleSendHandshake(id, 0);

    return id;
  }

  /**
   * @note ignores any properties other than `status`, `triesLeft` and `nextNonce`
   */
  public async updateSubscription(
    id: number,
    data: Partial<SubscriptionEntity>
  ): Promise<SubscriptionEntity> {
    const { subscriptions } = this;

    const updater = pick(data, 'status', 'triesLeft', 'nextNonce');

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
   * Increase the latest nonce of many subscriptions at once by one
   */
  public async batchBumpNonce(ids: number[]): Promise<void> {
    const { subscriptions } = this;

    ids.forEach(id => {
      subscriptions[id].nextNonce += 1;
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
  private async sendHandshake(id: number): Promise<void> {
    const subscription = await this.findOne(id);

    if (subscription.isExpired()) {
      return;
    }

    const { webhookUrl, triesLeft } = subscription;
    const { httpService, logger } = this;

    try {
      const secret = await generateBase64Secret(32);

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
  private async retry(id: number, triesLeft: number): Promise<void> {
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
}
