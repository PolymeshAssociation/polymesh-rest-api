/* istanbul ignore file */

import { FactoryProvider } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Column, DataSource, Entity, PrimaryGeneratedColumn, Repository } from 'typeorm';

import { EventType } from '~/events/types';
import { SubscriptionStatus } from '~/subscriptions/types';

@Entity()
export class Subscription {
  @PrimaryGeneratedColumn('increment')
  public id: number;

  @Column({ type: 'text' })
  public eventType: EventType;

  @Column({ type: 'text' })
  public eventScope: string;

  @Column({ type: 'text' })
  public webhookUrl: string;

  @Column({ type: 'int' })
  public ttl: number;

  @Column({ type: 'text' })
  public status: SubscriptionStatus;

  @Column({ type: 'int' })
  public triesLeft: number;

  @Column({ type: 'int' })
  public nextNonce: number;

  @Column({ type: 'text' })
  public legitimacySecret: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  public createdAt: Date;
}

export const subscriptionRepoProvider: FactoryProvider = {
  provide: getRepositoryToken(Subscription),
  useFactory: async (dataSource: DataSource): Promise<Repository<Subscription>> => {
    return dataSource.getRepository(Subscription);
  },
  inject: [DataSource],
};
