import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TopicName } from '~/common/utils/amqp';
import { OfflineEvent } from '~/datastore/postgres/entities/offline-event.entity';
import { convertTypeOrmErrorToAppError } from '~/datastore/postgres/repos/utils';
import { OfflineEventModel } from '~/offline-recorder/model/offline-event.model';
import { OfflineEventRepo } from '~/offline-recorder/repo/offline-event.repo';

@Injectable()
export class PostgresOfflineEventRepo implements OfflineEventRepo {
  constructor(
    @InjectRepository(OfflineEvent) private readonly offlineEventRepo: Repository<OfflineEvent>
  ) {}

  public async recordEvent(
    topicName: string,
    body: Record<string, unknown>
  ): Promise<OfflineEventModel> {
    const model = { topicName, body };
    const entity = this.offlineEventRepo.create(model);

    await this.offlineEventRepo
      .save(entity)
      .catch(convertTypeOrmErrorToAppError(topicName, OfflineEventRepo.type));

    return this.toModel(entity);
  }

  private toModel(event: OfflineEvent): OfflineEventModel {
    const { id, topicName, body } = event;

    return new OfflineEventModel({
      id: id.toString(),
      topicName: topicName as TopicName,
      body,
    });
  }
}
