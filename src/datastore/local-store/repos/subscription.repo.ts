import { Injectable } from '@nestjs/common';

import { AppNotFoundError } from '~/common/errors';
import { SubscriptionModel } from '~/subscriptions/models/subscription.model';
import { SubscriptionRepo } from '~/subscriptions/repo/subscription.repo';
import { SubscriptionParams } from '~/subscriptions/types';

@Injectable()
export class LocalSubscriptionRepo implements SubscriptionRepo {
  private currentId = 0;
  private subscriptions: Record<string, SubscriptionModel> = {};

  public async create(params: SubscriptionParams): Promise<SubscriptionModel> {
    this.currentId += 1;

    const model = new SubscriptionModel({
      id: this.currentId,
      ...params,
    });

    this.subscriptions[model.id] = model;

    return model;
  }

  public async update(id: number, params: SubscriptionParams): Promise<SubscriptionModel> {
    const model = this.subscriptions[id];

    const updated = new SubscriptionModel({
      ...model,
      ...params,
    });

    this.subscriptions[id] = updated;

    return updated;
  }

  public async findById(id: number): Promise<SubscriptionModel> {
    const subscription = this.subscriptions[id];

    if (!subscription) {
      throw new AppNotFoundError(id.toString(), 'notification');
    }

    return subscription;
  }

  public async findAll(): Promise<SubscriptionModel[]> {
    return Object.values(this.subscriptions);
  }

  public async incrementNonces(ids: number[]): Promise<void> {
    ids.forEach(id => {
      this.subscriptions[id].nextNonce += 1;
    });
  }
}
