import { HttpService } from '@nestjs/axios';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { lastValueFrom } from 'rxjs';

import { AppNotFoundError } from '~/common/errors';
import { generateBase64Secret } from '~/common/utils';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';
import { ScheduleService } from '~/schedule/schedule.service';
import subscriptionsConfig from '~/subscriptions/config/subscriptions.config';
import { SubscriptionModel } from '~/subscriptions/models/subscription.model';
import { SubscriptionRepo } from '~/subscriptions/repo/subscription.repo';
import { HANDSHAKE_HEADER_KEY } from '~/subscriptions/subscriptions.consts';
import { SubscriptionStatus } from '~/subscriptions/types';

@Injectable()
export class SubscriptionsService {
  private ttl: number;
  private maxTries: number;
  private retryInterval: number;

  constructor(
    @Inject(subscriptionsConfig.KEY) config: ConfigType<typeof subscriptionsConfig>,
    private readonly scheduleService: ScheduleService,
    private readonly httpService: HttpService,
    // TODO @polymath-eric: handle errors with specialized service
    private readonly logger: PolymeshLogger,
    private readonly subscriptionRepo: SubscriptionRepo
  ) {
    const { ttl, maxTries: triesLeft, retryInterval } = config;

    this.ttl = ttl;
    this.maxTries = triesLeft;
    this.retryInterval = retryInterval;

    logger.setContext(SubscriptionsService.name);
  }

  /**
   * Fetch all subscriptions. Allows filtering by different parameters and excluding
   *   expired subscriptions from the result (default behavior is to include them)
   */
  public async findAll(
    filters: Partial<Pick<SubscriptionModel, 'eventType' | 'eventScope' | 'status'>> & {
      excludeExpired?: boolean;
    } = {}
  ): Promise<SubscriptionModel[]> {
    const {
      status: statusFilter,
      eventScope: scopeFilter,
      eventType: typeFilter,
      excludeExpired = false,
    } = filters;

    const subscriptions = await this.subscriptionRepo.findAll();

    return subscriptions.filter(subscription => {
      const { status, eventScope, eventType } = subscription;

      return (
        (!statusFilter || statusFilter === status) &&
        (!scopeFilter || scopeFilter === eventScope) &&
        (!typeFilter || typeFilter === eventType) &&
        (!excludeExpired || !subscription.isExpired())
      );
    });
  }

  public async findOne(id: number): Promise<SubscriptionModel> {
    const sub = await this.subscriptionRepo.findById(id);

    if (!sub) {
      throw new AppNotFoundError('subscription', id.toString());
    }

    return sub;
  }

  public async createSubscription(
    sub: Pick<SubscriptionModel, 'eventType' | 'eventScope' | 'webhookUrl' | 'legitimacySecret'>
  ): Promise<number> {
    const { subscriptionRepo, ttl, maxTries: triesLeft } = this;

    const { id } = await subscriptionRepo.create({
      ...sub,
      triesLeft,
      status: SubscriptionStatus.Inactive,
      ttl,
      nextNonce: 0,
      createdAt: new Date(),
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
    data: Partial<SubscriptionModel>
  ): Promise<SubscriptionModel> {
    return await this.subscriptionRepo.update(id, data);
  }

  /**
   * Change the status of many subscriptions at once to "done"
   */
  public async batchMarkAsDone(ids: number[]): Promise<void> {
    await Promise.all(
      ids.map(async id => {
        return this.updateSubscription(id, { status: SubscriptionStatus.Done });
      })
    );
  }

  /**
   * Increase the latest nonce of many subscriptions at once by one
   */
  public async batchBumpNonce(ids: number[]): Promise<void> {
    await this.subscriptionRepo.incrementNonces(ids);
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
