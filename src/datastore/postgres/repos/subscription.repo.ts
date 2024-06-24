import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AppNotFoundError } from '~/common/errors';
import { Subscription } from '~/datastore/postgres/entities/subscription.entity';
import { convertTypeOrmErrorToAppError } from '~/datastore/postgres/repos/utils';
import { SubscriptionModel } from '~/subscriptions/models/subscription.model';
import { SubscriptionRepo } from '~/subscriptions/repo/subscription.repo';
import { SubscriptionParams } from '~/subscriptions/types';

@Injectable()
export class PostgresSubscriptionRepo implements SubscriptionRepo {
  constructor(@InjectRepository(Subscription) private subscriptionRepo: Repository<Subscription>) {}

  public async create(params: SubscriptionParams): Promise<SubscriptionModel> {
    const entity = this.subscriptionRepo.create({
      ...params,
    });

    await this.subscriptionRepo
      .save(entity)
      .catch(convertTypeOrmErrorToAppError('subscription', SubscriptionRepo.type));

    const subscription = new SubscriptionModel({
      ...entity,
    });

    return subscription;
  }

  public async update(id: number, params: SubscriptionParams): Promise<SubscriptionModel> {
    await this.subscriptionRepo.update(id, params);

    return this.findById(id);
  }

  public async findById(id: number): Promise<SubscriptionModel> {
    const entity = await this.subscriptionRepo.findOneBy({ id });

    if (!entity) {
      throw new AppNotFoundError(id.toString(), SubscriptionRepo.type);
    }

    return new SubscriptionModel({
      ...entity,
    });
  }

  public async findAll(): Promise<SubscriptionModel[]> {
    const results = await this.subscriptionRepo.find();

    return results.map(value => new SubscriptionModel(value));
  }

  public async incrementNonces(ids: number[]): Promise<void> {
    /* istanbul ignore next: inline function isn't testable */
    const nextNonce = (): string => 'nextNonce +1';

    await this.subscriptionRepo
      .createQueryBuilder()
      .update(Subscription)
      .set({ nextNonce })
      .where('id IN (:...ids)', { ids })
      .execute();
  }
}
