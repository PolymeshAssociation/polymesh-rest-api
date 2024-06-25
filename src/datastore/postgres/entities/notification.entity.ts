/* istanbul ignore file */

import { FactoryProvider } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Column, DataSource, Entity, PrimaryGeneratedColumn, Repository } from 'typeorm';

import { NotificationStatus } from '~/notifications/types';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn('increment')
  public id: number;

  @Column({ type: 'int' })
  public subscriptionId: number;

  @Column({ type: 'int' })
  public eventId: number;

  @Column({ type: 'int' })
  public triesLeft: number;

  @Column({ type: 'text' })
  public status: NotificationStatus;

  @Column({ type: 'int' })
  public nonce: number;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  public createdAt: Date;
}

export const notificationRepoProvider: FactoryProvider = {
  provide: getRepositoryToken(Notification),
  useFactory: async (dataSource: DataSource): Promise<Repository<Notification>> => {
    return dataSource.getRepository(Notification);
  },
  inject: [DataSource],
};
