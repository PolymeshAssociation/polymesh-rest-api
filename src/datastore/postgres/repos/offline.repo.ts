import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TopicName } from '~/common/utils/amqp';
import { OfflineEvent } from '~/datastore/postgres/entities/offline-event.entity';
import { convertTypeOrmErrorToAppError } from '~/datastore/postgres/repos/utils';
import { OfflineEventModel } from '~/offline-recorder/model/event.model';
import { OfflineRepo } from '~/offline-recorder/repo/offline.repo';

@Injectable()
export class PostgresOfflineRepo implements OfflineRepo {
  constructor(
    @InjectRepository(OfflineEvent) private readonly offlineEventRepo: Repository<OfflineEvent>
  ) {}

  public async recordEvent(
    name: string,
    body: Record<string, unknown>
  ): Promise<OfflineEventModel> {
    const model = { name, body };
    const entity = this.offlineEventRepo.create(model);

    await this.offlineEventRepo
      .save(entity)
      .catch(convertTypeOrmErrorToAppError(name, OfflineRepo.type));

    return this.toModel(entity);
  }

  private toModel(event: OfflineEvent): OfflineEventModel {
    const { id, name, body } = event;

    return new OfflineEventModel({
      id: id.toString(),
      name: name as TopicName,
      body,
    });
  }
}
