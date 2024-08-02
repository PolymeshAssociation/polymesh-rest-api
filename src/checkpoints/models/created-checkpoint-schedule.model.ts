/* istanbul ignore file */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { CheckpointScheduleModel } from '~/checkpoints/models/checkpoint-schedule.model';
import { TransactionQueueModel } from '~/common/models/transaction-queue.model';

export class CreatedCheckpointScheduleModel extends TransactionQueueModel {
  @ApiPropertyOptional({
    description: 'Static data (and identifiers) of the newly created Schedule',
    type: CheckpointScheduleModel,
  })
  @Type(() => CheckpointScheduleModel)
  readonly schedule: CheckpointScheduleModel;

  constructor(model: CreatedCheckpointScheduleModel) {
    const { transactions, details, ...rest } = model;
    super({ transactions, details });

    Object.assign(this, rest);
  }
}
