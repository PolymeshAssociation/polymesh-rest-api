/* istanbul ignore file */

import { FactoryProvider } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  Column,
  CreateDateColumn,
  DataSource,
  Entity,
  PrimaryGeneratedColumn,
  Repository,
} from 'typeorm';

@Entity()
export class OfflineEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createDateTime: Date;

  @Column({ type: 'text' })
  topicName: string;

  @Column({ type: 'json' })
  body: Record<string, unknown>;
}

export const offlineEventRepoProvider: FactoryProvider = {
  provide: getRepositoryToken(OfflineEvent),
  useFactory: async (dataSource: DataSource): Promise<Repository<OfflineEvent>> => {
    return dataSource.getRepository(OfflineEvent);
  },
  inject: [DataSource],
};
